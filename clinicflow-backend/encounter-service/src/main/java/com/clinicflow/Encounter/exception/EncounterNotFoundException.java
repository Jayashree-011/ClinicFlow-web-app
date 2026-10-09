package com.clinicflow.Encounter.exception;

public class EncounterNotFoundException extends RuntimeException {
    public EncounterNotFoundException(String message) {
        super(message);
    }
    
    public EncounterNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
