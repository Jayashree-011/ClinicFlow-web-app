package com.clinicflow.Encounter.service;

import com.clinicflow.Encounter.dto.ProblemListCreateRequest;
import com.clinicflow.Encounter.dto.ProblemListDTO;
import com.clinicflow.Encounter.entity.ProblemList;
import com.clinicflow.Encounter.entity.ProblemStatus;
import com.clinicflow.Encounter.exception.ProblemListNotFoundException;
import com.clinicflow.Encounter.repository.ProblemListRepository;
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
public class ProblemListService {
    
    private final ProblemListRepository problemListRepository;
    private final ModelMapper modelMapper;
    
    @Autowired
    public ProblemListService(ProblemListRepository problemListRepository, ModelMapper modelMapper) {
        this.problemListRepository = problemListRepository;
        this.modelMapper = modelMapper;
    }
    
    @Transactional
    public ProblemListDTO addProblem(ProblemListCreateRequest request) {
        log.info("Adding new problem for patient: {} in encounter: {}", request.getPatientId(), request.getEncounterId());
        
        ProblemList problem = ProblemList.builder()
                .patientId(request.getPatientId())
                .encounterId(request.getEncounterId())
                .code(request.getCode())
                .description(request.getDescription())
                .onsetDate(request.getOnsetDate())
                .icdCode(request.getIcdCode())
                .status(ProblemStatus.ACTIVE)
                .build();
        
        ProblemList savedProblem = problemListRepository.save(problem);
        log.info("Problem added successfully with ID: {}", savedProblem.getProblemId());
        
        return modelMapper.map(savedProblem, ProblemListDTO.class);
    }
    
    @Transactional
    public ProblemListDTO updateProblem(Long problemId, ProblemListDTO requestDTO) {
        log.info("Updating problem: {}", problemId);
        
        ProblemList problem = problemListRepository.findById(problemId)
                .orElseThrow(() -> new ProblemListNotFoundException("Problem not found: " + problemId));
        
        if (requestDTO.getDescription() != null) {
            problem.setDescription(requestDTO.getDescription());
        }
        if (requestDTO.getStatus() != null) {
            problem.setStatus(requestDTO.getStatus());
        }
        if (requestDTO.getOnsetDate() != null) {
            problem.setOnsetDate(requestDTO.getOnsetDate());
        }
        
        ProblemList updatedProblem = problemListRepository.save(problem);
        log.info("Problem updated successfully: {}", problemId);
        
        return modelMapper.map(updatedProblem, ProblemListDTO.class);
    }
    
    @Transactional
    public ProblemListDTO resolveProblem(Long problemId) {
        log.info("Resolving problem: {}", problemId);
        
        ProblemList problem = problemListRepository.findById(problemId)
                .orElseThrow(() -> new ProblemListNotFoundException("Problem not found: " + problemId));
        
        problem.setStatus(ProblemStatus.RESOLVED);
        
        ProblemList resolvedProblem = problemListRepository.save(problem);
        log.info("Problem resolved: {}", problemId);
        
        return modelMapper.map(resolvedProblem, ProblemListDTO.class);
    }
    
    public ProblemListDTO getProblemById(Long problemId) {
        log.info("Fetching problem: {}", problemId);
        
        ProblemList problem = problemListRepository.findById(problemId)
                .orElseThrow(() -> new ProblemListNotFoundException("Problem not found: " + problemId));
        
        return modelMapper.map(problem, ProblemListDTO.class);
    }
    
    public List<ProblemListDTO> getPatientProblems(Long patientId) {
        log.info("Fetching problems for patient: {}", patientId);
        
        return problemListRepository.findByPatientId(patientId)
                .stream()
                .map(problem -> modelMapper.map(problem, ProblemListDTO.class))
                .collect(Collectors.toList());
    }
    
    public List<ProblemListDTO> getActiveProblems(Long patientId) {
        log.info("Fetching active problems for patient: {}", patientId);
        
        return problemListRepository.findActiveProblems(patientId)
                .stream()
                .map(problem -> modelMapper.map(problem, ProblemListDTO.class))
                .collect(Collectors.toList());
    }
    
    public List<ProblemListDTO> getEncounterProblems(Long encounterId) {
        log.info("Fetching problems for encounter: {}", encounterId);
        
        return problemListRepository.findByEncounterId(encounterId)
                .stream()
                .map(problem -> modelMapper.map(problem, ProblemListDTO.class))
                .collect(Collectors.toList());
    }
    
    public List<ProblemListDTO> getPatientProblemsByStatus(Long patientId, ProblemStatus status) {
        log.info("Fetching problems for patient: {} with status: {}", patientId, status);
        
        return problemListRepository.findByPatientIdAndStatus(patientId, status)
                .stream()
                .map(problem -> modelMapper.map(problem, ProblemListDTO.class))
                .collect(Collectors.toList());
    }
}
