package com.seishin.web.dto.coach;

import lombok.Data;

@Data
public class CreateInviteCodeDto {
    /** Если указан — код для привязки к существующему ученику, иначе — код клуба для родителей */
    private Long studentId;
}
