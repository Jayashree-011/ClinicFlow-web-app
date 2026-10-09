package com.clinicflow.billingService.dto;

import com.clinicflow.billingService.client.EncounterServiceClient;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EncounterDTO {
    private Long patientId;
    private Long clinicianId;
    //private Encounter.EncounterStatus status;
    //private Encounter.VisitType visitType;

    private String chiefComplaint;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private LocalDateTime signedAt;
    private Long signedByFk;
    private Integer version;

    //private List<ProblemListDTO> problemList;

    // ✅ Entity → DTO
    /*public static EncounterDTO fromEntity(Encounter encounter) {
        EncounterDTO dto = new EncounterDTO();
        dto.patientId = encounter.getPatientId();
        dto.clinicianId = encounter.getClinicianId();
        dto.status = encounter.getStatus();
        dto.visitType = encounter.getVisitType();
        dto.chiefComplaint = encounter.getChiefComplaint();
        dto.startAt = encounter.getStartAt();
        dto.endAt = encounter.getEndAt();
        dto.signedAt = encounter.getSignedAt();
        dto.signedByFk = encounter.getSignedByFk();
        dto.version = encounter.getVersion();
        return dto;
    }

    // ✅ DTO → Entity
    public Encounter toEntity() {
        return Encounter.builder()
                .patientId(patientId)
                .clinicianId(clinicianId)
                .status(status)
                .visitType(visitType)
                .chiefComplaint(chiefComplaint)
                .startAt(startAt)
                .endAt(endAt)
                .signedAt(signedAt)
                .signedByFk(signedByFk)
                .version(version)
                .build();
    } */
}