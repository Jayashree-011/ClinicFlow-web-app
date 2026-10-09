package com.clinicflow.billingService.service;

import com.clinicflow.billingService.dto.ServiceItemDTO;
import com.clinicflow.billingService.entity.ServiceItem;
import com.clinicflow.billingService.exception.ObjectNotFoundException;
import com.clinicflow.billingService.repository.ServiceItemsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceItemService {

    private final ServiceItemsRepository serviceItemsRepository;

    /* ── Create ──────────────────────────────────────────────────────────── */

    @Transactional
    public ServiceItemDTO createServiceItem(ServiceItemDTO dto) {
        ServiceItem entity = dto.toEntity();
        return ServiceItemDTO.fromEntity(serviceItemsRepository.save(entity));
    }

    /* ── Read ────────────────────────────────────────────────────────────── */

    @Transactional(readOnly = true)
    public ServiceItemDTO getById(Long id) {
        return serviceItemsRepository.findById(id)
                .map(ServiceItemDTO::fromEntity)
                .orElseThrow(() -> new ObjectNotFoundException("ServiceItem not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<ServiceItemDTO> getAll() {
        return serviceItemsRepository.findAll().stream()
                .map(ServiceItemDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ServiceItemDTO> getByInvoice(Long invoiceId) {
        return serviceItemsRepository.findByInvoiceId(invoiceId).stream()
                .map(ServiceItemDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ServiceItemDTO> getByPatient(Long patientId) {
        return serviceItemsRepository.findByPatientId(patientId).stream()
                .map(ServiceItemDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ServiceItemDTO> getByCategory(ServiceItem.BillingCategory category) {
        return serviceItemsRepository.findByBillingCategory(category).stream()
                .map(ServiceItemDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /* ── Update ──────────────────────────────────────────────────────────── */

    @Transactional
    public ServiceItemDTO updateServiceItem(Long id, ServiceItemDTO dto) {
        ServiceItem existing = serviceItemsRepository.findById(id)
                .orElseThrow(() -> new ObjectNotFoundException("ServiceItem not found with id: " + id));

        existing.setCode(dto.getCode());
        existing.setDescription(dto.getDescription());
        existing.setPatientId(dto.getPatientId());
        existing.setInvoiceId(dto.getInvoiceId());
        existing.setPrice(dto.getPrice());
        existing.setDepartment(dto.getDepartment());
        existing.setBillingCategory(dto.getBillingCategory());
        existing.setStatus(dto.getStatus());

        return ServiceItemDTO.fromEntity(serviceItemsRepository.save(existing));
    }

    /* ── Delete ──────────────────────────────────────────────────────────── */

    @Transactional
    public void deleteServiceItem(Long id) {
        if (!serviceItemsRepository.existsById(id)) {
            throw new ObjectNotFoundException("ServiceItem not found with id: " + id);
        }
        serviceItemsRepository.deleteById(id);
    }
}
