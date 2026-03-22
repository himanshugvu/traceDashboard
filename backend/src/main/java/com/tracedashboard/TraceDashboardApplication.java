package com.tracedashboard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class TraceDashboardApplication {

    public static void main(String[] args) {
        SpringApplication.run(TraceDashboardApplication.class, args);
    }
}
