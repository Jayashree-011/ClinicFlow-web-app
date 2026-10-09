package com.clinicflow.Encounter.exception;

public class ProblemListNotFoundException extends RuntimeException {
    public ProblemListNotFoundException(String message) {
        super(message);
    }
    
    public ProblemListNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
