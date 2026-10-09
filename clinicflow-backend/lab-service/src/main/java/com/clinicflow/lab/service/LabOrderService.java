package com.clinicflow.lab.service;

import com.clinicflow.lab.client.BillingServiceClient;
import com.clinicflow.lab.dto.LabOrderDTO;
import com.clinicflow.lab.entity.LabOrder;
import com.clinicflow.lab.repository.LabOrderRepository;
import com.clinicflow.lab.repository.LabResultRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LabOrderService {

    @Autowired
    private LabOrderRepository labOrderRepository;

    @Autowired
    private LabResultRepository labResultRepository;

    @Autowired
    private BillingServiceClient billingServiceClient;

    public List<LabOrderDTO> getAllLabOrders() {
        return labOrderRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public LabOrderDTO getLabOrderById(Long id) {
        return labOrderRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("LabOrder not found with id: " + id));
    }

    public LabOrderDTO createLabOrder(LabOrderDTO labOrderDTO) {
        LabOrder labOrder = toEntity(labOrderDTO);
        validateLabOrder(labOrder);
        LabOrderDTO saved = toDto(labOrderRepository.save(labOrder));

        // Fire-and-forget: create a PENDING invoice in billing-service.
        // Failures are swallowed inside billingServiceClient — never blocks lab order creation.
        billingServiceClient.createLabOrderInvoice(
                saved.getPatientId(),
                saved.getEncounterId(),
                saved.getLabOrderId());

        return saved;
    }

    public LabOrderDTO updateLabOrder(Long id, LabOrderDTO labOrderDTO) {
        LabOrder labOrder = labOrderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("LabOrder not found with id: " + id));

        labOrder.setEncounterId(labOrderDTO.getEncounterId());
        labOrder.setPatientId(labOrderDTO.getPatientId());
        labOrder.setOrderedBy(labOrderDTO.getOrderedBy());
        labOrder.setTestsJson(labOrderDTO.getTestsJson());
        labOrder.setSampleId(labOrderDTO.getSampleId());
        labOrder.setCollectedAt(labOrderDTO.getCollectedAt());
        labOrder.setStatus(labOrderDTO.getStatus());
        labOrder.setResultUri(labOrderDTO.getResultUri());

        validateLabOrder(labOrder);
        return toDto(labOrderRepository.save(labOrder));
    }

    public List<LabOrderDTO> getLabOrdersByPatient(Long patientId) {
        return labOrderRepository.findByPatientId(patientId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public void deleteLabOrder(Long id) {
        if (!labOrderRepository.existsById(id)) {
            throw new EntityNotFoundException("LabOrder not found with id: " + id);
        }
        labResultRepository.deleteAll(labResultRepository.findByLabOrderId(id));
        labOrderRepository.deleteById(id);
    }

    private LabOrderDTO toDto(LabOrder labOrder) {
        LabOrderDTO dto = new LabOrderDTO();
        dto.setLabOrderId(labOrder.getLabOrderId());
        dto.setEncounterId(labOrder.getEncounterId());
        dto.setPatientId(labOrder.getPatientId());
        dto.setOrderedBy(labOrder.getOrderedBy());
        dto.setTestsJson(labOrder.getTestsJson());
        dto.setSampleId(labOrder.getSampleId());
        dto.setCollectedAt(labOrder.getCollectedAt());
        dto.setStatus(labOrder.getStatus());
        dto.setResultUri(labOrder.getResultUri());
        return dto;
    }

    private LabOrder toEntity(LabOrderDTO dto) {
        LabOrder labOrder = new LabOrder();
        labOrder.setLabOrderId(dto.getLabOrderId());
        labOrder.setEncounterId(dto.getEncounterId());
        labOrder.setPatientId(dto.getPatientId());
        labOrder.setOrderedBy(dto.getOrderedBy());
        labOrder.setTestsJson(dto.getTestsJson());
        labOrder.setSampleId(dto.getSampleId());
        labOrder.setCollectedAt(dto.getCollectedAt());
        labOrder.setStatus(dto.getStatus());
        labOrder.setResultUri(dto.getResultUri());
        return labOrder;
    }

    private void validateLabOrder(LabOrder labOrder) {
        if (labOrder.getPatientId() == null) {
            throw new IllegalArgumentException("PatientId cannot be null");
        }
        if (labOrder.getEncounterId() == null) {
            throw new IllegalArgumentException("EncounterId cannot be null");
        }
        if (labOrder.getOrderedBy() == null) {
            throw new IllegalArgumentException("OrderedBy cannot be null");
        }
        if (labOrder.getTestsJson() == null || labOrder.getTestsJson().isEmpty()) {
            throw new IllegalArgumentException("TestsJson cannot be null or empty");
        }
    }
}
