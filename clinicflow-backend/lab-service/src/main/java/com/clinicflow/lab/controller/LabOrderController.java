package com.clinicflow.lab.controller;

import com.clinicflow.lab.dto.LabOrderDTO;
import com.clinicflow.lab.service.LabOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lab/orders")
public class LabOrderController {

    @Autowired
    private LabOrderService labOrderService;

    @GetMapping
    public ResponseEntity<List<LabOrderDTO>> getAllLabOrders() {
        return ResponseEntity.ok(labOrderService.getAllLabOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LabOrderDTO> getLabOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(labOrderService.getLabOrderById(id));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<LabOrderDTO>> getLabOrdersByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(labOrderService.getLabOrdersByPatient(patientId));
    }

    @PostMapping
    public ResponseEntity<LabOrderDTO> createLabOrder(@RequestBody LabOrderDTO labOrderDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(labOrderService.createLabOrder(labOrderDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LabOrderDTO> updateLabOrder(@PathVariable Long id, @RequestBody LabOrderDTO labOrderDTO) {
        return ResponseEntity.ok(labOrderService.updateLabOrder(id, labOrderDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLabOrder(@PathVariable Long id) {
        labOrderService.deleteLabOrder(id);
        return ResponseEntity.noContent().build();
    }
}
