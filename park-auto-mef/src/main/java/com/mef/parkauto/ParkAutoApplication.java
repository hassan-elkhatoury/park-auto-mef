package com.mef.parkauto;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ParkAutoApplication {

    public static void main(String[] args) {
        SpringApplication.run(ParkAutoApplication.class, args);
    }
}
