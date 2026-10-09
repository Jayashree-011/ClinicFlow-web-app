package com.clinicflow.Encounter.controller;

import com.clinicflow.Encounter.dto.ProblemListCreateRequest;
import com.clinicflow.Encounter.dto.ProblemListDTO;
import com.clinicflow.Encounter.entity.ProblemStatus;
import com.clinicflow.Encounter.service.ProblemListService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/encounter/problem-list")
@Slf4j
public class ProblemListController {
    
    private final ProblemListService problemListService;
    
    @Autowired
    public ProblemListController(ProblemListService problemListService) {
        this.problemListService = problemListService;
    }
    
    @PostMapping
    public ResponseEntity<ProblemListDTO> addProblem(@RequestBody ProblemListCreateRequest request) {
        log.info("Received request to add problem for patient: {}", request.getPatientId());
        ProblemListDTO problem = problemListService.addProblem(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(problem);
    }
    
    @GetMapping("/{problemId}")
    public ResponseEntity<ProblemListDTO> getProblem(@PathVariable Long problemId) {
        log.info("Fetching problem: {}", problemId);
        ProblemListDTO problem = problemListService.getProblemById(problemId);
        return ResponseEntity.ok(problem);
    }
    
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<ProblemListDTO>> getPatientProblems(@PathVariable Long patientId) {
        log.info("Fetching problems for patient: {}", patientId);
        List<ProblemListDTO> problems = problemListService.getPatientProblems(patientId);
        return ResponseEntity.ok(problems);
    }
    
    @GetMapping("/patient/{patientId}/active")
    public ResponseEntity<List<ProblemListDTO>> getActiveProblems(@PathVariable Long patientId) {
        log.info("Fetching active problems for patient: {}", patientId);
        List<ProblemListDTO> problems = problemListService.getActiveProblems(patientId);
        return ResponseEntity.ok(problems);
    }
    
    @GetMapping("/encounter/{encounterId}")
    public ResponseEntity<List<ProblemListDTO>> getEncounterProblems(@PathVariable Long encounterId) {
        log.info("Fetching problems for encounter: {}", encounterId);
        List<ProblemListDTO> problems = problemListService.getEncounterProblems(encounterId);
        return ResponseEntity.ok(problems);
    }
    
    @GetMapping("/patient/{patientId}/status/{status}")
    public ResponseEntity<List<ProblemListDTO>> getPatientProblemsByStatus(
            @PathVariable Long patientId,
            @PathVariable ProblemStatus status) {
        log.info("Fetching problems for patient: {} with status: {}", patientId, status);
        List<ProblemListDTO> problems = problemListService.getPatientProblemsByStatus(patientId, status);
        return ResponseEntity.ok(problems);
    }
    
    @PutMapping("/{problemId}")
    public ResponseEntity<ProblemListDTO> updateProblem(
            @PathVariable Long problemId,
            @RequestBody ProblemListDTO requestDTO) {
        log.info("Updating problem: {}", problemId);
        ProblemListDTO problem = problemListService.updateProblem(problemId, requestDTO);
        return ResponseEntity.ok(problem);
    }
    
    @PostMapping("/{problemId}/resolve")
    public ResponseEntity<ProblemListDTO> resolveProblem(@PathVariable Long problemId) {
        log.info("Resolving problem: {}", problemId);
        ProblemListDTO problem = problemListService.resolveProblem(problemId);
        return ResponseEntity.ok(problem);
    }
}
