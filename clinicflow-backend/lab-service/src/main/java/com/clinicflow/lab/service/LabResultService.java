package com.clinicflow.lab.service;

import com.clinicflow.lab.client.NotificationServiceClient;
import com.clinicflow.lab.dto.LabResultDTO;
import com.clinicflow.lab.entity.LabResult;
import com.clinicflow.lab.repository.LabResultRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LabResultService {

    @Autowired
    private LabResultRepository labResultRepository;

    @Autowired
    private com.clinicflow.lab.repository.LabOrderRepository labOrderRepository;

    @Autowired(required = false)
    private NotificationServiceClient notificationServiceClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<LabResultDTO> getAllLabResults() {
        return labResultRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public LabResultDTO getLabResultById(Long id) {
        return labResultRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("LabResult not found with id: " + id));
    }

    public LabResultDTO createLabResult(LabResultDTO labResultDTO) {
        LabResult labResult = toEntity(labResultDTO);
        validateAndSetFlag(labResult);
        if (labResult.getReportedAt() == null) {
            labResult.setReportedAt(LocalDateTime.now());
        }
        LabResultDTO saved = toDto(labResultRepository.save(labResult));

        // Fire-and-forget: notify the patient their results are ready.
        // Resolve patientId from the parent LabOrder.
        if (notificationServiceClient != null && labResult.getLabOrderId() != null) {
            Long patientId = labOrderRepository.findById(labResult.getLabOrderId())
                    .map(order -> order.getPatientId())
                    .orElse(null);
            notificationServiceClient.notifyLabResultReady(
                    patientId,
                    labResult.getLabOrderId(),
                    labResult.getTestCode(),
                    labResult.getFlag() != null ? labResult.getFlag().name() : null);
        }

        return saved;
    }

    public LabResultDTO updateLabResult(Long id, LabResultDTO labResultDTO) {
        LabResult labResult = labResultRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("LabResult not found with id: " + id));

        labResult.setLabOrderId(labResultDTO.getLabOrderId());
        labResult.setTestCode(labResultDTO.getTestCode());
        labResult.setResultValue(labResultDTO.getResultValue());
        labResult.setUnits(labResultDTO.getUnits());
        labResult.setReferenceRangeJson(labResultDTO.getReferenceRangeJson());
        labResult.setReportedAt(labResultDTO.getReportedAt());
        labResult.setReportedBy(labResultDTO.getReportedBy());

        validateAndSetFlag(labResult);
        return toDto(labResultRepository.save(labResult));
    }

    public List<LabResultDTO> getLabResultsByOrder(Long labOrderId) {
        return labResultRepository.findByLabOrderId(labOrderId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public void deleteLabResult(Long id) {
        if (!labResultRepository.existsById(id)) {
            throw new EntityNotFoundException("LabResult not found with id: " + id);
        }
        labResultRepository.deleteById(id);
    }

    private LabResultDTO toDto(LabResult labResult) {
        LabResultDTO dto = new LabResultDTO();
        dto.setResultId(labResult.getResultId());
        dto.setLabOrderId(labResult.getLabOrderId());
        dto.setTestCode(labResult.getTestCode());
        dto.setResultValue(labResult.getResultValue());
        dto.setUnits(labResult.getUnits());
        dto.setReferenceRangeJson(labResult.getReferenceRangeJson());
        dto.setFlag(labResult.getFlag());
        dto.setReportedAt(labResult.getReportedAt());
        dto.setReportedBy(labResult.getReportedBy());
        return dto;
    }

    private LabResult toEntity(LabResultDTO dto) {
        LabResult labResult = new LabResult();
        labResult.setResultId(dto.getResultId());
        labResult.setLabOrderId(dto.getLabOrderId());
        labResult.setTestCode(dto.getTestCode());
        labResult.setResultValue(dto.getResultValue());
        labResult.setUnits(dto.getUnits());
        labResult.setReferenceRangeJson(dto.getReferenceRangeJson());
        labResult.setFlag(dto.getFlag());
        labResult.setReportedAt(dto.getReportedAt());
        labResult.setReportedBy(dto.getReportedBy());
        return labResult;
    }

    private void validateAndSetFlag(LabResult labResult) {
        if (labResult.getReferenceRangeJson() != null && labResult.getResultValue() != null) {
            try {
                JsonNode range = objectMapper.readTree(labResult.getReferenceRangeJson());
                Double min = range.has("min") ? range.get("min").asDouble() : null;
                Double max = range.has("max") ? range.get("max").asDouble() : null;
                Double criticalMin = range.has("criticalMin") ? range.get("criticalMin").asDouble() : null;
                Double criticalMax = range.has("criticalMax") ? range.get("criticalMax").asDouble() : null;

                double value = Double.parseDouble(labResult.getResultValue());

                if ((criticalMin != null && value < criticalMin) || (criticalMax != null && value > criticalMax)) {
                    labResult.setFlag(LabResult.Flag.CRITICAL);
                } else if ((min != null && value < min) || (max != null && value > max)) {
                    if (min != null && value < min) {
                        labResult.setFlag(LabResult.Flag.LOW);
                    } else if (max != null && value > max) {
                        labResult.setFlag(LabResult.Flag.HIGH);
                    }
                } else {
                    labResult.setFlag(LabResult.Flag.NORMAL);
                }
            } catch (Exception e) {
                labResult.setFlag(LabResult.Flag.NORMAL);
            }
        } else {
            labResult.setFlag(LabResult.Flag.NORMAL);
        }
    }
}
