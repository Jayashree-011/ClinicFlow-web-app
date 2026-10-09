package com.clinicflow.lab.controller;

import com.clinicflow.lab.dto.LabResultDTO;
import com.clinicflow.lab.service.LabResultService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lab/results")
public class LabResultController {

    @Autowired
    private LabResultService labResultService;

    @GetMapping
    public ResponseEntity<List<LabResultDTO>> getAllLabResults() {
        return ResponseEntity.ok(labResultService.getAllLabResults());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LabResultDTO> getLabResultById(@PathVariable Long id) {
        return ResponseEntity.ok(labResultService.getLabResultById(id));
    }

    @GetMapping("/order/{labOrderId}")
    public ResponseEntity<List<LabResultDTO>> getLabResultsByOrder(@PathVariable Long labOrderId) {
        return ResponseEntity.ok(labResultService.getLabResultsByOrder(labOrderId));
    }

    @PostMapping
    public ResponseEntity<LabResultDTO> createLabResult(@RequestBody LabResultDTO labResultDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(labResultService.createLabResult(labResultDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LabResultDTO> updateLabResult(@PathVariable Long id, @RequestBody LabResultDTO labResultDTO) {
        return ResponseEntity.ok(labResultService.updateLabResult(id, labResultDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLabResult(@PathVariable Long id) {
        labResultService.deleteLabResult(id);
        return ResponseEntity.noContent().build();
    }
}
