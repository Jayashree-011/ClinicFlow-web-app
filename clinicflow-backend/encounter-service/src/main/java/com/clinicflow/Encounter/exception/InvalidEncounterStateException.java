package com.clinicflow.Encounter.exception;

public class InvalidEncounterStateException extends RuntimeException {
    public InvalidEncounterStateException(String message) {
        super(message);
    }
    
    public InvalidEncounterStateException(String message, Throwable cause) {
        super(message, cause);
    }
}
