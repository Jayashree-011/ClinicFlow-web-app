package com.clinicflow.consultation.dto;

import com.clinicflow.consultation.entity.Patient;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
public class PatientDTO {

    private Long id;          // consultation-service patientId
    private Long userId;      // user-service userId — provided on self-registration to skip re-provisioning
    private String mrn;
    @JsonAlias("fullName")    // Register.tsx sends fullName; admin UI sends name — accept both
    private String name;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate dob;    // was java.util.Date — serialised as timestamp, not ISO date

    private String gender;
    private String email;
    @JsonAlias("phone")   // frontend form sends "phone"; serialised response still uses "phoneNumber"
    private String phoneNumber;
    private String address;
    private String condition;
    private String status;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate lastVisit;   // was lastVisitDate — frontend maps p.lastVisit

    private Long registeredByUserId;   // links family members to account holder's userId
    private String relationship;       // stored inside addressJson blob

    private static final ObjectMapper mapper = new ObjectMapper();

    public PatientDTO(Patient patient) {
        this.id          = patient.getPatientId();
        this.userId      = patient.getUserId();
        this.mrn         = patient.getMrn();
        this.name        = patient.getName();
        this.dob         = patient.getDob();
        this.gender      = patient.getGender();
        this.condition   = patient.getCondition();
        this.status      = patient.getStatus();
        this.lastVisit          = patient.getLastVisitDate();
        this.registeredByUserId = patient.getRegisteredByUserId();

        // parse contactInfoJson → email + phoneNumber
        String contactJson = patient.getContactInfoJson();
        if (contactJson != null && !contactJson.isBlank()) {
            try {
                JsonNode json = mapper.readTree(contactJson);
                this.email       = json.has("email") ? json.get("email").asText() : null;
                this.phoneNumber = json.has("phone") ? json.get("phone").asText() : null;
            } catch (Exception e) {
                this.email       = null;
                this.phoneNumber = null;
            }
        }

        // parse addressJson → flat address string
        String addrJson = patient.getAddressJson();
        if (addrJson != null && !addrJson.isBlank()) {
            try {
                JsonNode json = mapper.readTree(addrJson);
                String street = json.has("street") ? json.get("street").asText("") : "";
                String city   = json.has("city")   ? json.get("city").asText("")   : "";
                String zip    = json.has("zip")    ? json.get("zip").asText("")    : "";
                StringBuilder sb = new StringBuilder();
                if (!street.isBlank()) sb.append(street);
                if (!city.isBlank())   { if (sb.length() > 0) sb.append(", "); sb.append(city); }
                if (!zip.isBlank())    { if (sb.length() > 0) sb.append(" ");  sb.append(zip);  }
                this.address      = sb.length() > 0 ? sb.toString() : addrJson;
                this.relationship = json.has("relationship") ? json.get("relationship").asText(null) : null;
            } catch (Exception e) {
                this.address = addrJson;
            }
        }
    }
 
    public Patient toPatient() {
        Patient patient = new Patient();

        patient.setUserId(userId);

        // auto-generate MRN when not supplied (new patient registration)
        patient.setMrn(mrn != null && !mrn.isBlank()
                ? mrn
                : "MRN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        patient.setName(name);
        patient.setDob(dob);
        patient.setGender(gender);
        patient.setCondition(condition);
        patient.setStatus(status != null ? status : "ACTIVE");
        patient.setLastVisitDate(lastVisit != null ? lastVisit : LocalDate.now());
        patient.setPrimaryContact(email != null && !email.isBlank() ? email : phoneNumber);

        // build contactInfoJson safely via ObjectNode (no string concatenation)
        try {
            ObjectNode contact = mapper.createObjectNode();
            contact.put("email", email       != null ? email       : "");
            contact.put("phone", phoneNumber != null ? phoneNumber : "");
            patient.setContactInfoJson(mapper.writeValueAsString(contact));
        } catch (Exception e) {
            patient.setContactInfoJson("{}");
        }

        // build addressJson — store the flat address string under "street" + relationship
        try {
            ObjectNode addr = mapper.createObjectNode();
            addr.put("street", address != null ? address : "");
            addr.put("city",   "");
            addr.put("zip",    "");
            if (relationship != null && !relationship.isBlank()) addr.put("relationship", relationship);
            patient.setAddressJson(mapper.writeValueAsString(addr));
        } catch (Exception e) {
            patient.setAddressJson("{}");
        }

        patient.setRegisteredByUserId(registeredByUserId);
        patient.setUpdatedAt(LocalDateTime.now());
        if (id == null) {
            patient.setCreatedAt(LocalDateTime.now());
        }

        return patient;
    }
}
