package com.seishin.web.dto.coach;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CoachClubProfileDto {
    private String name;
    private String description;
    private String address;
    private String logo;
    /** Opaque JSON for belt systems state from the coach app. */
    private String beltStateJson;
}
