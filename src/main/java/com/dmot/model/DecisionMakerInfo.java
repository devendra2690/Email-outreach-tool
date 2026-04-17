package com.dmot.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DecisionMakerInfo {
    private String firstName;
    private String lastName;
    private String fullName;
    private String title;
    private String company;
    private String domain;
    private String sourceUrl;
}
