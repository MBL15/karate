package com.seishin.service;

import com.seishin.domain.entity.DocumentTemplate;
import com.seishin.domain.entity.Student;
import com.seishin.repository.DocumentTemplateRepository;
import com.seishin.security.UserPrincipal;
import com.seishin.web.dto.document.DocumentDto;
import com.seishin.web.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentTemplateRepository documentRepository;
    private final ParentAccessService parentAccessService;

    public List<DocumentDto> listForParent(UserPrincipal parent) {
        List<Student> children = parentAccessService.linkedChildren(parent.getId());
        if (children.isEmpty()) {
            return List.of();
        }
        Long clubId = children.getFirst().getClub().getId();
        return documentRepository.findByClubId(clubId).stream().map(this::toDto).toList();
    }

    public DocumentDto getDocument(UserPrincipal parent, Long documentId) {
        DocumentTemplate doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new NotFoundException("Документ не найден"));
        List<Student> children = parentAccessService.linkedChildren(parent.getId());
        boolean allowed = children.stream()
                .anyMatch(s -> s.getClub().getId().equals(doc.getClub().getId()));
        if (!allowed) {
            throw new NotFoundException("Документ не найден");
        }
        return toDto(doc);
    }

    private DocumentDto toDto(DocumentTemplate doc) {
        return DocumentDto.builder()
                .id(doc.getId())
                .title(doc.getTitle())
                .type(doc.getType())
                .content(doc.getContent())
                .build();
    }
}
