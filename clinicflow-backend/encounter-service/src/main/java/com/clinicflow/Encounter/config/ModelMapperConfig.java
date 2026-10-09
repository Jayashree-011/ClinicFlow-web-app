package com.clinicflow.Encounter.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.modelmapper.Converter;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ModelMapperConfig {

    // NOTE: Do NOT declare a custom ObjectMapper @Bean here.
    // Spring Boot auto-configures one with JavaTimeModule, Jdk8Module, etc.
    // Declaring a bare new ObjectMapper() would override it and break JSON
    // handling for LocalDateTime and other types.

    @Bean
    public ModelMapper modelMapper(ObjectMapper objectMapper) {
        ModelMapper modelMapper = new ModelMapper();

        // Entity stores JSON columns as String; DTO exposes them as Object (Map/List).
        // These converters let ModelMapper bridge the two representations.

        Converter<String, Object> stringToObject = context -> {
            String source = context.getSource();
            if (source == null || source.isBlank()) return null;
            try {
                return objectMapper.readValue(source, Object.class);
            } catch (Exception e) {
                // Not valid JSON — return the raw string rather than crashing
                return source;
            }
        };

        Converter<Object, String> objectToString = context -> {
            Object source = context.getSource();
            if (source == null) return null;
            try {
                return objectMapper.writeValueAsString(source);
            } catch (Exception e) {
                return source.toString();
            }
        };

        modelMapper.addConverter(stringToObject);
        modelMapper.addConverter(objectToString);

        return modelMapper;
    }
}
