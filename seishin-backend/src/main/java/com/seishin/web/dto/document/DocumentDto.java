package com.seishin.web.dto.document;

import com.seishin.domain.enums.DocumentType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DocumentDto {
    private Long id;
    private String title;
    private DocumentType type;
    private String content;
}
