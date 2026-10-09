package com.clinicflow.lab.service;

import com.clinicflow.lab.client.BillingServiceClient;
import com.clinicflow.lab.dto.LabOrderDTO;
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

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LabOrderService Unit Tests")
class LabOrderServiceTest {

    @Mock private LabOrderRepository labOrderRepository;
    @Mock private LabResultRepository labResultRepository;
    @Mock private BillingServiceClient billingServiceClient;
    @InjectMocks private LabOrderService labOrderService;

    // ─── getAllLabOrders ──────────────────────────────────────────────────────

    @Test
    @DisplayName("getAllLabOrders: returns all orders mapped to DTOs")
    void getAllLabOrders_returnsMappedList() {
        List<LabOrder> orders = List.of(
                buildLabOrder(1L, 10L, 100L, 5L, "[{\"test\":\"CBC\"}]"),
                buildLabOrder(2L, 20L, 200L, 6L, "[{\"test\":\"BMP\"}]"));
        when(labOrderRepository.findAll()).thenReturn(orders);

        List<LabOrderDTO> result = labOrderService.getAllLabOrders();

        assertThat(result).hasSize(2);
    }

    // ─── getLabOrderById ──────────────────────────────────────────────────────

    @Test
    @DisplayName("getLabOrderById: returns DTO when found")
    void getLabOrderById_whenFound_returnsDTO() {
        LabOrder order = buildLabOrder(1L, 10L, 100L, 5L, "[{\"test\":\"CBC\"}]");
        when(labOrderRepository.findById(1L)).thenReturn(Optional.of(order));

        LabOrderDTO result = labOrderService.getLabOrderById(1L);

        assertThat(result.getLabOrderId()).isEqualTo(1L);
        assertThat(result.getPatientId()).isEqualTo(10L);
    }

    @Test
    @DisplayName("getLabOrderById: throws EntityNotFoundException when not found")
    void getLabOrderById_whenNotFound_throwsEntityNotFound() {
        when(labOrderRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> labOrderService.getLabOrderById(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─── createLabOrder ───────────────────────────────────────────────────────

    @Test
    @DisplayName("createLabOrder: saves valid order and calls billing")
    void createLabOrder_validOrder_savesAndCallsBilling() {
        LabOrderDTO dto   = buildLabOrderDTO(null, 10L, 100L, 5L, "[{\"test\":\"CBC\"}]");
        LabOrder entity   = buildLabOrder(null, 10L, 100L, 5L, "[{\"test\":\"CBC\"}]");
        LabOrder saved    = buildLabOrder(1L, 10L, 100L, 5L, "[{\"test\":\"CBC\"}]");

        when(labOrderRepository.save(any(LabOrder.class))).thenReturn(saved);

        LabOrderDTO result = labOrderService.createLabOrder(dto);

        assertThat(result.getLabOrderId()).isEqualTo(1L);
        verify(billingServiceClient).createLabOrderInvoice(10L, 100L, 1L);
    }

    @Test
    @DisplayName("createLabOrder: throws when patientId is null")
    void createLabOrder_whenPatientIdNull_throwsIllegalArgument() {
        LabOrderDTO dto = buildLabOrderDTO(null, null, 100L, 5L, "[{\"test\":\"CBC\"}]");

        assertThatThrownBy(() -> labOrderService.createLabOrder(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("PatientId cannot be null");
    }

    @Test
    @DisplayName("createLabOrder: throws when encounterId is null")
    void createLabOrder_whenEncounterIdNull_throwsIllegalArgument() {
        LabOrderDTO dto = buildLabOrderDTO(null, 10L, null, 5L, "[{\"test\":\"CBC\"}]");

        assertThatThrownBy(() -> labOrderService.createLabOrder(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("EncounterId cannot be null");
    }

    @Test
    @DisplayName("createLabOrder: throws when orderedBy is null")
    void createLabOrder_whenOrderedByNull_throwsIllegalArgument() {
        LabOrderDTO dto = buildLabOrderDTO(null, 10L, 100L, null, "[{\"test\":\"CBC\"}]");

        assertThatThrownBy(() -> labOrderService.createLabOrder(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("OrderedBy cannot be null");
    }

    @Test
    @DisplayName("createLabOrder: throws when testsJson is null")
    void createLabOrder_whenTestsJsonNull_throwsIllegalArgument() {
        LabOrderDTO dto = buildLabOrderDTO(null, 10L, 100L, 5L, null);

        assertThatThrownBy(() -> labOrderService.createLabOrder(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("TestsJson cannot be null or empty");
    }

    @Test
    @DisplayName("createLabOrder: throws when testsJson is empty")
    void createLabOrder_whenTestsJsonEmpty_throwsIllegalArgument() {
        LabOrderDTO dto = buildLabOrderDTO(null, 10L, 100L, 5L, "");

        assertThatThrownBy(() -> labOrderService.createLabOrder(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("TestsJson cannot be null or empty");
    }

    // ─── updateLabOrder ───────────────────────────────────────────────────────

    @Test
    @DisplayName("updateLabOrder: updates all fields when order exists")
    void updateLabOrder_whenFound_updatesFields() {
        LabOrder existing = buildLabOrder(1L, 10L, 100L, 5L, "[{\"test\":\"CBC\"}]");
        when(labOrderRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(labOrderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        LabOrderDTO updates = buildLabOrderDTO(1L, 10L, 101L, 6L, "[{\"test\":\"BMP\"}]");
        updates.setStatus("COMPLETED");
        updates.setSampleId("SAMPLE-001");

        LabOrderDTO result = labOrderService.updateLabOrder(1L, updates);

        assertThat(result.getEncounterId()).isEqualTo(101L);
        assertThat(result.getOrderedBy()).isEqualTo(6L);
        assertThat(result.getStatus()).isEqualTo("COMPLETED");
    }

    @Test
    @DisplayName("updateLabOrder: throws when order not found")
    void updateLabOrder_whenNotFound_throws() {
        when(labOrderRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> labOrderService.updateLabOrder(99L,
                buildLabOrderDTO(99L, 10L, 100L, 5L, "[{}]")))
                .isInstanceOf(EntityNotFoundException.class);
    }

    // ─── getLabOrdersByPatient ─────────────────────────────────────────────────

    @Test
    @DisplayName("getLabOrdersByPatient: returns orders for patient")
    void getLabOrdersByPatient_returnsMatchingOrders() {
        List<LabOrder> orders = List.of(buildLabOrder(1L, 10L, 100L, 5L, "[{}]"));
        when(labOrderRepository.findByPatientId(10L)).thenReturn(orders);

        List<LabOrderDTO> result = labOrderService.getLabOrdersByPatient(10L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getPatientId()).isEqualTo(10L);
    }

    // ─── deleteLabOrder ───────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteLabOrder: deletes associated results then the order")
    void deleteLabOrder_whenFound_deletesResultsThenOrder() {
        List<LabResult> results = List.of(new LabResult(), new LabResult());
        when(labOrderRepository.existsById(1L)).thenReturn(true);
        when(labResultRepository.findByLabOrderId(1L)).thenReturn(results);
        doNothing().when(labResultRepository).deleteAll(results);
        doNothing().when(labOrderRepository).deleteById(1L);

        labOrderService.deleteLabOrder(1L);

        verify(labResultRepository).deleteAll(results);
        verify(labOrderRepository).deleteById(1L);
    }

    @Test
    @DisplayName("deleteLabOrder: throws EntityNotFoundException when not found")
    void deleteLabOrder_whenNotFound_throws() {
        when(labOrderRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> labOrderService.deleteLabOrder(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private LabOrder buildLabOrder(Long id, Long patientId, Long encounterId,
                                   Long orderedBy, String testsJson) {
        LabOrder o = new LabOrder();
        o.setLabOrderId(id);
        o.setPatientId(patientId);
        o.setEncounterId(encounterId);
        o.setOrderedBy(orderedBy);
        o.setTestsJson(testsJson);
        o.setStatus("PENDING");
        return o;
    }

    private LabOrderDTO buildLabOrderDTO(Long id, Long patientId, Long encounterId,
                                         Long orderedBy, String testsJson) {
        LabOrderDTO dto = new LabOrderDTO();
        dto.setLabOrderId(id);
        dto.setPatientId(patientId);
        dto.setEncounterId(encounterId);
        dto.setOrderedBy(orderedBy);
        dto.setTestsJson(testsJson);
        dto.setStatus("PENDING");
        return dto;
    }
}
