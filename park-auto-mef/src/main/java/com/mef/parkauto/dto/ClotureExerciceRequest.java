package com.mef.parkauto.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClotureExerciceRequest {
    private String observations;

    public static ClotureExerciceRequestBuilder builder() {
        return new ClotureExerciceRequestBuilder();
    }

    public static class ClotureExerciceRequestBuilder {
        private String observations;

        ClotureExerciceRequestBuilder() {
        }

        public ClotureExerciceRequestBuilder observations(String observations) {
            this.observations = observations;
            return this;
        }

        public ClotureExerciceRequest build() {
            return new ClotureExerciceRequest(this.observations);
        }

        public String toString() {
            return "ClotureExerciceRequest.ClotureExerciceRequestBuilder(observations=" + this.observations + ")";
        }
    }
}
