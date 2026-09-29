package com.seishin.service;

import com.seishin.domain.entity.Student;
import com.seishin.repository.ParentStudentLinkRepository;
import com.seishin.repository.StudentRepository;
import com.seishin.security.UserPrincipal;
import com.seishin.web.exception.ForbiddenException;
import com.seishin.web.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ParentAccessService {

    private final ParentStudentLinkRepository linkRepository;
    private final StudentRepository studentRepository;

    public Student requireLinkedChild(UserPrincipal parent, Long studentId) {
        if (!linkRepository.existsByParentIdAndStudentId(parent.getId(), studentId)) {
            throw new ForbiddenException("Нет доступа к этому ребёнку");
        }
        return studentRepository.findById(studentId)
                .orElseThrow(() -> new NotFoundException("Ученик не найден"));
    }

    public List<Student> linkedChildren(Long parentId) {
        return linkRepository.findByParentId(parentId).stream()
                .map(link -> link.getStudent())
                .toList();
    }
}
