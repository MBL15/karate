package com.seishin.web.dto.coach;

import lombok.Data;

@Data
public class AssignBeltDto {
    /** Если null — нужны name, color и sortOrder (создадим или найдём ступень в клубе). */
    private Long beltLevelId;
    private String name;
    private String color;
    private Integer sortOrder;
}
