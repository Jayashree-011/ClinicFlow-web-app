package com.clinicflow.Encounter.service;

import com.clinicflow.Encounter.client.PrescriptionClient;
import com.clinicflow.Encounter.dto.EncounterCreateRequest;
import com.clinicflow.Encounter.dto.EncounterDTO;
import com.clinicflow.Encounter.dto.PrescriptionSyncRequest;
import com.clinicflow.Encounter.dto.PrescriptionSyncResponse;
import com.clinicflow.Encounter.entity.Encounter;
import com.clinicflow.Encounter.entity.EncounterStatus;
import com.clinicflow.Encounter.exception.EncounterNotFoundException;
import com.clinicflow.Encounter.exception.InvalidEncounterStateException;
import com.clinicflow.Encounter.repository.EncounterRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class EncounterService {

    private final EncounterRepository encounterRepository;
    private final ModelMapper modelMapper;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired(required = false)
    private PrescriptionClient prescriptionClient;

    @Autowired
    public EncounterService(EncounterRepository encounterRepository, ModelMapper modelMapper) {
        this.encounterRepository = encounterRepository;
        this.modelMapper = modelMapper;
    }

    @Transactional
    public EncounterDTO createEncounter(EncounterCreateRequest request) {
        log.info("Creating new encounter for patient: {}", request.getPatientId());

        Encounter encounter = Encounter.builder()
                .patientId(request.getPatientId())
                .doctorId(request.getDoctorId())
                .visitType(request.getVisitType())
                .chiefComplaint(request.getChiefComplaint())
                .vitals(toJsonString(request.getVitals()))
                .notes(toJsonString(request.getNotes()))
                .startAt(request.getStartAt())
                .status(EncounterStatus.IN_PROGRESS)
                .build();

        Encounter savedEncounter = encounterRepository.save(encounter);
        log.info("Encounter created successfully with ID: {}", savedEncounter.getEncounterId());

        return modelMapper.map(savedEncounter, EncounterDTO.class);
    }

    @Transactional
    public EncounterDTO updateEncounter(Long encounterId, EncounterDTO requestDTO) {
        log.info("Updating encounter: {}", encounterId);

        Encounter encounter = encounterRepository.findById(encounterId)
                .orElseThrow(() -> new EncounterNotFoundException("Encounter not found: " + encounterId));

        if (encounter.getStatus() == EncounterStatus.SIGNED) {
            throw new InvalidEncounterStateException("Cannot update a signed encounter");
        }

        if (requestDTO.getChiefComplaint() != null) {
            encounter.setChiefComplaint(requestDTO.getChiefComplaint());
        }
        if (requestDTO.getVitals() != null) {
            encounter.setVitals(toJsonString(requestDTO.getVitals()));
        }
        if (requestDTO.getNotes() != null) {
            encounter.setNotes(toJsonString(requestDTO.getNotes()));
        }
        if (requestDTO.getDiagnoses() != null) {
            encounter.setDiagnoses(toJsonString(requestDTO.getDiagnoses()));
        }
        if (requestDTO.getOrders() != null) {
            encounter.setOrders(toJsonString(requestDTO.getOrders()));
        }
        if (requestDTO.getPrescriptions() != null) {
            encounter.setPrescriptions(toJsonString(requestDTO.getPrescriptions()));
        }

        Encounter updatedEncounter = encounterRepository.save(encounter);
        log.info("Encounter updated successfully: {}", encounterId);

        return modelMapper.map(updatedEncounter, EncounterDTO.class);
    }

    @Transactional
    public EncounterDTO completeEncounter(Long encounterId) {
        log.info("Completing encounter: {}", encounterId);

        Encounter encounter = encounterRepository.findById(encounterId)
                .orElseThrow(() -> new EncounterNotFoundException("Encounter not found: " + encounterId));

        if (encounter.getStatus() != EncounterStatus.IN_PROGRESS) {
            throw new InvalidEncounterStateException("Cannot complete encounter with status: " + encounter.getStatus());
        }

        encounter.setStatus(EncounterStatus.COMPLETED);
        encounter.setEndAt(LocalDateTime.now());

        Encounter updatedEncounter = encounterRepository.save(encounter);
        log.info("Encounter completed: {}", encounterId);

        return modelMapper.map(updatedEncounter, EncounterDTO.class);
    }

    @Transactional
    public EncounterDTO signEncounter(Long encounterId, Long doctorId) {
        log.info("Signing encounter: {} by doctor: {}", encounterId, doctorId);

        Encounter encounter = encounterRepository.findById(encounterId)
                .orElseThrow(() -> new EncounterNotFoundException("Encounter not found: " + encounterId));

        if (encounter.getStatus() != EncounterStatus.COMPLETED) {
            throw new InvalidEncounterStateException("Can only sign completed encounters");
        }

        encounter.setStatus(EncounterStatus.SIGNED);
        encounter.setSignedBy(doctorId);
        encounter.setSignedAt(LocalDateTime.now());

        Encounter signedEncounter = encounterRepository.save(encounter);
        log.info("Encounter signed successfully: {}", encounterId);

        syncPrescriptionsToService(signedEncounter);

        return modelMapper.map(signedEncounter, EncounterDTO.class);
    }

    @SuppressWarnings("unchecked")
    private void syncPrescriptionsToService(Encounter encounter) {
        if (prescriptionClient == null
                || encounter.getPrescriptions() == null
                || encounter.getPrescriptions().isBlank()) {
            return;
        }
        try {
            Object parsed = objectMapper.readValue(encounter.getPrescriptions(), Object.class);
            List<Object> items = parsed instanceof List<?>
                    ? (List<Object>) parsed
                    : List.of(parsed);

            for (Object item : items) {
                PrescriptionSyncRequest req = objectMapper.convertValue(item, PrescriptionSyncRequest.class);
                req.setEncounterId(encounter.getEncounterId());
                req.setPatientId(encounter.getPatientId());
                req.setDoctorId(encounter.getDoctorId());

                PrescriptionSyncResponse created = prescriptionClient.createPrescription(req);
                if (created != null && created.getRxId() != null) {
                    prescriptionClient.issuePrescription(created.getRxId());
                }
            }
            log.info("Synced {} prescription(s) to prescription-service for encounter {}",
                    items.size(), encounter.getEncounterId());
        } catch (Exception e) {
            log.warn("Failed to sync prescriptions for encounter {}: {}",
                    encounter.getEncounterId(), e.getMessage());
        }
    }

    @Transactional
    public EncounterDTO cancelEncounter(Long encounterId) {
        log.info("Cancelling encounter: {}", encounterId);

        Encounter encounter = encounterRepository.findById(encounterId)
                .orElseThrow(() -> new EncounterNotFoundException("Encounter not found: " + encounterId));

        if (encounter.getStatus() == EncounterStatus.SIGNED) {
            throw new InvalidEncounterStateException("Cannot cancel a signed encounter");
        }

        encounter.setStatus(EncounterStatus.CANCELLED);

        Encounter cancelledEncounter = encounterRepository.save(encounter);
        log.info("Encounter cancelled: {}", encounterId);

        return modelMapper.map(cancelledEncounter, EncounterDTO.class);
    }

    public EncounterDTO getEncounterById(Long encounterId) {
        log.info("Fetching encounter: {}", encounterId);

        Encounter encounter = encounterRepository.findById(encounterId)
                .orElseThrow(() -> new EncounterNotFoundException("Encounter not found: " + encounterId));

        return modelMapper.map(encounter, EncounterDTO.class);
    }

    public List<EncounterDTO> getEncountersByPatient(Long patientId) {
        log.info("Fetching encounters for patient: {}", patientId);

        return encounterRepository.findByPatientId(patientId)
                .stream()
                .map(encounter -> modelMapper.map(encounter, EncounterDTO.class))
                .collect(Collectors.toList());
    }

    public List<EncounterDTO> getEncountersByDoctorAndStatus(Long doctorId, EncounterStatus status) {
        log.info("Fetching encounters for doctor: {} with status: {}", doctorId, status);

        return encounterRepository.findByDoctorIdAndStatus(doctorId, status)
                .stream()
                .map(encounter -> modelMapper.map(encounter, EncounterDTO.class))
                .collect(Collectors.toList());
    }

    public List<EncounterDTO> getEncountersByDateRange(Long patientId, LocalDateTime start, LocalDateTime end) {
        log.info("Fetching encounters for patient: {} between {} and {}", patientId, start, end);

        return encounterRepository.findEncountersByPatientAndDateRange(patientId, start, end)
                .stream()
                .map(encounter -> modelMapper.map(encounter, EncounterDTO.class))
                .collect(Collectors.toList());
    }

    public boolean hasActiveEncounters(Long patientId) {
        return encounterRepository.hasActiveEncounters(patientId);
    }

    @Transactional
    public EncounterDTO addDiagnosis(Long encounterId, Object diagnosis) {
        log.info("Adding diagnosis to encounter: {}", encounterId);

        Encounter encounter = encounterRepository.findById(encounterId)
                .orElseThrow(() -> new EncounterNotFoundException("Encounter not found: " + encounterId));

        encounter.setDiagnoses(toJsonString(diagnosis));

        Encounter updatedEncounter = encounterRepository.save(encounter);
        log.info("Diagnosis added to encounter: {}", encounterId);

        return modelMapper.map(updatedEncounter, EncounterDTO.class);
    }

    @Transactional
    public EncounterDTO addVitals(Long encounterId, Object vitals) {
        log.info("Adding vitals to encounter: {}", encounterId);

        Encounter encounter = encounterRepository.findById(encounterId)
                .orElseThrow(() -> new EncounterNotFoundException("Encounter not found: " + encounterId));

        encounter.setVitals(toJsonString(vitals));

        Encounter updatedEncounter = encounterRepository.save(encounter);
        log.info("Vitals added to encounter: {}", encounterId);

        return modelMapper.map(updatedEncounter, EncounterDTO.class);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Serializes any Object (typically a Map deserialized from JSON) to a JSON string.
     * Returns null if value is null.
     */
    private String toJsonString(Object value) {
        if (value == null) return null;
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            log.warn("Could not serialize value to JSON string: {}", e.getMessage());
            return value.toString();
        }
    }
}
