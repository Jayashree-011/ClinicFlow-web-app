package com.clinicflow.Encounter.utility;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

@Component
public class JsonHelper {
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public String toJson(Object object) throws Exception {
        return objectMapper.writeValueAsString(object);
    }
    
    public <T> T fromJson(String json, Class<T> clazz) throws Exception {
        return objectMapper.readValue(json, clazz);
    }
}
