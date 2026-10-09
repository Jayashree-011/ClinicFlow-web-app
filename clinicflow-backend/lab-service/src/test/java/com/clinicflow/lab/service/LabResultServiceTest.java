package com.clinicflow.lab.service;

import com.clinicflow.lab.client.NotificationServiceClient;
import com.clinicflow.lab.dto.LabResultDTO;
import com.clinicflow.lab.entity.LabOrder;
import com.clinicflow.lab.entity.LabResult;
import com.clinicflow.lab.repository.LabOrderRepository;
import com.clinicflow.lab.repository.LabResultRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LabResultService Unit Tests")
class LabResultServiceTest {

    @Mock private LabResultRepository labResultRepository;
    @Mock private LabOrderRepository labOrderRepository;
    @Mock private NotificationServiceClient notificationServiceClient;
    @InjectMocks private LabResultService labResultService;

    // ─── getAllLabResults ─────────────────────────────────────────────────────

    @Test
    @DisplayName("getAllLabResults: returns all results mapped to DTOs")
    void getAllLabResults_returnsMappedList() {
        List<LabResult> results = List.of(
                buildLabResult(1L, 10L, "CBC", "7.5", null, null),
                buildLabResult(2L, 10L, "BMP", "4.2", null, null));
        when(labResultRepository.findAll()).thenReturn(results);

        List<LabResultDTO> result = labResultService.getAllLabResults();

        assertThat(result).hasSize(2);
    }

    // ─── getLabResultById ─────────────────────────────────────────────────────

    @Test
    @DisplayName("getLabResultById: returns DTO when found")
    void getLabResultById_whenFound_returnsDTO() {
        LabResult labResult = buildLabResult(1L, 10L, "CBC", "7.5", null, null);
        when(labResultRepository.findById(1L)).thenReturn(Optional.of(labResult));

        LabResultDTO result = labResultService.getLabResultById(1L);

        assertThat(result.getResultId()).isEqualTo(1L);
        assertThat(result.getTestCode()).isEqualTo("CBC");
    }

    @Test
    @DisplayName("getLabResultById: throws EntityNotFoundException when not found")
    void getLabResultById_whenNotFound_throwsEntityNotFound() {
        when(labResultRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> labResultService.getLabResultById(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─── createLabResult: flag derivation ─────────────────────────────────────

    @Test
    @DisplayName("createLabResult: flags NORMAL when value is within range")
    void createLabResult_whenValueInRange_flagsNormal() {
        LabResultDTO dto = buildLabResultDTO(null, 10L, "HGB", "13.5",
                "{\"min\":12.0,\"max\":16.0}");
        LabResult saved = buildLabResult(1L, 10L, "HGB", "13.5",
                "{\"min\":12.0,\"max\":16.0}", LabResult.Flag.NORMAL);

        when(labResultRepository.save(any(LabResult.class))).thenReturn(saved);

        LabResultDTO result = labResultService.createLabResult(dto);

        assertThat(result.getFlag()).isEqualTo(LabResult.Flag.NORMAL);
    }

    @Test
    @DisplayName("createLabResult: flags HIGH when value exceeds max")
    void createLabResult_whenValueAboveMax_flagsHigh() {
        LabResultDTO dto = buildLabResultDTO(null, 10L, "HGB", "18.0",
                "{\"min\":12.0,\"max\":16.0}");
        LabResult saved = buildLabResult(1L, 10L, "HGB", "18.0",
                "{\"min\":12.0,\"max\":16.0}", LabResult.Flag.HIGH);

        when(labResultRepository.save(any())).thenReturn(saved);

        LabResultDTO result = labResultService.createLabResult(dto);

        assertThat(result.getFlag()).isEqualTo(LabResult.Flag.HIGH);
    }

    @Test
    @DisplayName("createLabResult: flags LOW when value is below min")
    void createLabResult_whenValueBelowMin_flagsLow() {
        LabResultDTO dto = buildLabResultDTO(null, 10L, "HGB", "10.0",
                "{\"min\":12.0,\"max\":16.0}");
        LabResult saved = buildLabResult(1L, 10L, "HGB", "10.0",
                "{\"min\":12.0,\"max\":16.0}", LabResult.Flag.LOW);

        when(labResultRepository.save(any())).thenReturn(saved);

        LabResultDTO result = labResultService.createLabResult(dto);

        assertThat(result.getFlag()).isEqualTo(LabResult.Flag.LOW);
    }

    @Test
    @DisplayName("createLabResult: flags CRITICAL when value exceeds criticalMax")
    void createLabResult_whenValueAboveCriticalMax_flagsCritical() {
        LabResultDTO dto = buildLabResultDTO(null, 10L, "K", "7.5",
                "{\"min\":3.5,\"max\":5.0,\"criticalMin\":2.5,\"criticalMax\":6.5}");
        LabResult saved = buildLabResult(1L, 10L, "K", "7.5",
                "{\"min\":3.5,\"max\":5.0,\"criticalMin\":2.5,\"criticalMax\":6.5}",
                LabResult.Flag.CRITICAL);

        when(labResultRepository.save(any())).thenReturn(saved);

        LabResultDTO result = labResultService.createLabResult(dto);

        assertThat(result.getFlag()).isEqualTo(LabResult.Flag.CRITICAL);
    }

    @Test
    @DisplayName("createLabResult: flags CRITICAL when value is below criticalMin")
    void createLabResult_whenValueBelowCriticalMin_flagsCritical() {
        LabResultDTO dto = buildLabResultDTO(null, 10L, "K", "2.0",
                "{\"min\":3.5,\"max\":5.0,\"criticalMin\":2.5,\"criticalMax\":6.5}");
        LabResult saved = buildLabResult(1L, 10L, "K", "2.0",
                "{\"min\":3.5,\"max\":5.0,\"criticalMin\":2.5,\"criticalMax\":6.5}",
                LabResult.Flag.CRITICAL);

        when(labResultRepository.save(any())).thenReturn(saved);

        LabResultDTO result = labResultService.createLabResult(dto);

        assertThat(result.getFlag()).isEqualTo(LabResult.Flag.CRITICAL);
    }

    @Test
    @DisplayName("createLabResult: flags NORMAL when no reference range provided")
    void createLabResult_whenNoReferenceRange_flagsNormal() {
        LabResultDTO dto = buildLabResultDTO(null, 10L, "CBC", "7.5", null);
        LabResult saved  = buildLabResult(1L, 10L, "CBC", "7.5", null, LabResult.Flag.NORMAL);

        when(labResultRepository.save(any())).thenReturn(saved);

        LabResultDTO result = labResultService.createLabResult(dto);

        assertThat(result.getFlag()).isEqualTo(LabResult.Flag.NORMAL);
    }

    @Test
    @DisplayName("createLabResult: sets reportedAt when not provided")
    void createLabResult_whenReportedAtNull_setsTimestamp() {
        LabResultDTO dto = buildLabResultDTO(null, 10L, "CBC", "7.5", null);
        dto.setReportedAt(null);

        when(labResultRepository.save(any(LabResult.class)))
                .thenAnswer(inv -> {
                    LabResult r = inv.getArgument(0);
                    assertThat(r.getReportedAt()).isNotNull();
                    return buildLabResult(1L, 10L, "CBC", "7.5", null, LabResult.Flag.NORMAL);
                });

        labResultService.createLabResult(dto);
    }

    @Test
    @DisplayName("createLabResult: notifies patient when notificationClient and labOrderId present")
    void createLabResult_notifiesPatientAfterSave() {
        LabResultDTO dto = buildLabResultDTO(null, 10L, "CBC", "7.5", null);
        LabResult saved  = buildLabResult(1L, 10L, "CBC", "7.5", null, LabResult.Flag.NORMAL);

        LabOrder order = new LabOrder();
        order.setLabOrderId(10L);
        order.setPatientId(42L);

        when(labResultRepository.save(any())).thenReturn(saved);
        when(labOrderRepository.findById(10L)).thenReturn(Optional.of(order));

        labResultService.createLabResult(dto);

        verify(notificationServiceClient).notifyLabResultReady(eq(42L), eq(10L), eq("CBC"), any());
    }

    // ─── updateLabResult ──────────────────────────────────────────────────────

    @Test
    @DisplayName("updateLabResult: updates all fields when result exists")
    void updateLabResult_whenFound_updatesFields() {
        LabResult existing = buildLabResult(1L, 10L, "CBC", "7.5", null, LabResult.Flag.NORMAL);
        when(labResultRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(labResultRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        LabResultDTO updates = buildLabResultDTO(1L, 10L, "HGB", "14.0",
                "{\"min\":12.0,\"max\":16.0}");
        updates.setUnits("g/dL");
        updates.setReportedBy(99L);

        LabResultDTO result = labResultService.updateLabResult(1L, updates);

        assertThat(result.getTestCode()).isEqualTo("HGB");
        assertThat(result.getResultValue()).isEqualTo("14.0");
    }

    @Test
    @DisplayName("updateLabResult: throws EntityNotFoundException when not found")
    void updateLabResult_whenNotFound_throws() {
        when(labResultRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> labResultService.updateLabResult(99L,
                buildLabResultDTO(99L, 10L, "CBC", "7.5", null)))
                .isInstanceOf(EntityNotFoundException.class);
    }

    // ─── getLabResultsByOrder ─────────────────────────────────────────────────

    @Test
    @DisplayName("getLabResultsByOrder: returns results for a given order")
    void getLabResultsByOrder_returnsMatchingResults() {
        List<LabResult> results = List.of(
                buildLabResult(1L, 10L, "CBC", "7.5", null, LabResult.Flag.NORMAL));
        when(labResultRepository.findByLabOrderId(10L)).thenReturn(results);

        List<LabResultDTO> resultList = labResultService.getLabResultsByOrder(10L);

        assertThat(resultList).hasSize(1);
        assertThat(resultList.get(0).getLabOrderId()).isEqualTo(10L);
    }

    // ─── deleteLabResult ──────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteLabResult: deletes when found")
    void deleteLabResult_whenFound_deletes() {
        when(labResultRepository.existsById(1L)).thenReturn(true);
        doNothing().when(labResultRepository).deleteById(1L);

        labResultService.deleteLabResult(1L);

        verify(labResultRepository).deleteById(1L);
    }

    @Test
    @DisplayName("deleteLabResult: throws EntityNotFoundException when not found")
    void deleteLabResult_whenNotFound_throws() {
        when(labResultRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> labResultService.deleteLabResult(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private LabResult buildLabResult(Long id, Long labOrderId, String testCode,
                                     String value, String rangeJson, LabResult.Flag flag) {
        LabResult r = new LabResult();
        r.setResultId(id);
        r.setLabOrderId(labOrderId);
        r.setTestCode(testCode);
        r.setResultValue(value);
        r.setReferenceRangeJson(rangeJson);
        r.setFlag(flag);
        r.setReportedAt(LocalDateTime.now());
        return r;
    }

    private LabResultDTO buildLabResultDTO(Long id, Long labOrderId, String testCode,
                                           String value, String rangeJson) {
        LabResultDTO dto = new LabResultDTO();
        dto.setResultId(id);
        dto.setLabOrderId(labOrderId);
        dto.setTestCode(testCode);
        dto.setResultValue(value);
        dto.setReferenceRangeJson(rangeJson);
        return dto;
    }
}
