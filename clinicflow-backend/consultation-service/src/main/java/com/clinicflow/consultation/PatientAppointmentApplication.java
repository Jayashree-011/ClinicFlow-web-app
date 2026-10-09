package com.clinicflow.consultation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication(scanBasePackages = "com.clinicflow.consultation")
@EnableJpaRepositories(basePackages = "com.clinicflow.consultation.repository")
@EnableDiscoveryClient
@EnableFeignClients
public class PatientAppointmentApplication {

	public static void main(String[] args) {
		SpringApplication.run(PatientAppointmentApplication.class, args);
	}

}
