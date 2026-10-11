package com.seishin.service;

import com.seishin.domain.entity.Club;
import com.seishin.domain.entity.Competition;
import com.seishin.domain.entity.CompetitionRegistration;
import com.seishin.domain.entity.Student;
import com.seishin.domain.enums.Discipline;
import com.seishin.domain.enums.RsvpStatus;
import com.seishin.repository.ClubRepository;
import com.seishin.repository.CompetitionRegistrationRepository;
import com.seishin.repository.CompetitionRepository;
import com.seishin.repository.StudentRepository;
import com.seishin.security.UserPrincipal;
import com.seishin.web.dto.competition.CategoryOverrideDto;
import com.seishin.web.dto.competition.CompetitionDto;
import com.seishin.web.dto.competition.CreateCompetitionDto;
import com.seishin.web.dto.competition.RegistrationDto;
import com.seishin.web.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompetitionService {

    private final CompetitionRepository competitionRepository;
    private final CompetitionRegistrationRepository registrationRepository;
    private final ClubRepository clubRepository;
    private final StudentRepository studentRepository;

    @Transactional
    public CompetitionDto createCompetition(UserPrincipal coach, CreateCompetitionDto dto) {
        Club club = clubRepository.findById(coach.getClubId())
                .orElseThrow(() -> new NotFoundException("Клуб не найден"));
        Competition competition = Competition.builder()
                .club(club)
                .name(dto.getName())
                .eventDate(dto.getEventDate())
                .location(dto.getLocation())
                .description(dto.getDescription())
                .build();
        competition = competitionRepository.save(competition);
        for (Student student : studentRepository.findByClubId(club.getId())) {
            registrationRepository.save(CompetitionRegistration.builder()
                    .competition(competition)
                    .student(student)
                    .rsvpStatus(RsvpStatus.PENDING)
                    .build());
        }
        return toCompetitionDto(competition);
    }

    public List<CompetitionDto> listForCoach(UserPrincipal coach) {
        return competitionRepository.findByClubIdOrderByEventDateAsc(coach.getClubId()).stream()
                .map(this::toCompetitionDto)
                .toList();
    }

    public CompetitionDto getCompetition(UserPrincipal coach, Long id) {
        Competition c = competitionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Соревнование не найдено"));
        if (!c.getClub().getId().equals(coach.getClubId())) {
            throw new NotFoundException("Соревнование не найдено");
        }
        return toCompetitionDto(c);
    }

    @Transactional
    public CompetitionDto autoCategorize(UserPrincipal coach, Long competitionId) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new NotFoundException("Соревнование не найдено"));
        if (!competition.getClub().getId().equals(coach.getClubId())) {
            throw new NotFoundException("Соревнование не найдено");
        }
        List<CompetitionRegistration> regs = registrationRepository.findByCompetitionId(competitionId);
        for (CompetitionRegistration reg : regs) {
            if (reg.getRsvpStatus() == RsvpStatus.CONFIRMED
                    && reg.getWeightKg() != null
                    && reg.getDiscipline() != null) {
                reg.setAutoCategory(computeCategory(reg.getStudent(), reg.getWeightKg(), reg.getDiscipline()));
                registrationRepository.save(reg);
            }
        }
        return toCompetitionDto(competition);
    }

    @Transactional
    public RegistrationDto overrideCategory(UserPrincipal coach, Long registrationId, CategoryOverrideDto dto) {
        CompetitionRegistration reg = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new NotFoundException("Регистрация не найдена"));
        if (!reg.getCompetition().getClub().getId().equals(coach.getClubId())) {
            throw new NotFoundException("Регистрация не найдена");
        }
        reg.setCoachOverrideCategory(dto.getCategory());
        return toRegistrationDto(registrationRepository.save(reg));
    }

    public byte[] exportExcel(UserPrincipal coach, Long competitionId) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new NotFoundException("Соревнование не найдено"));
        if (!competition.getClub().getId().equals(coach.getClubId())) {
            throw new NotFoundException("Соревнование не найдено");
        }
        List<CompetitionRegistration> regs = registrationRepository.findByCompetitionId(competitionId);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Registrations");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Ученик");
            header.createCell(1).setCellValue("Возраст");
            header.createCell(2).setCellValue("Вес");
            header.createCell(3).setCellValue("Дисциплина");
            header.createCell(4).setCellValue("RSVP");
            header.createCell(5).setCellValue("Категория");
            int rowIdx = 1;
            for (CompetitionRegistration reg : regs) {
                Row row = sheet.createRow(rowIdx++);
                Student s = reg.getStudent();
                row.createCell(0).setCellValue(s.getFirstName() + " " + s.getLastName());
                row.createCell(1).setCellValue(AgeCalculator.age(s.getBirthDate()));
                row.createCell(2).setCellValue(reg.getWeightKg() != null ? reg.getWeightKg() : 0);
                row.createCell(3).setCellValue(reg.getDiscipline() != null ? reg.getDiscipline().name() : "");
                row.createCell(4).setCellValue(reg.getRsvpStatus().name());
                row.createCell(5).setCellValue(effectiveCategory(reg));
            }
            for (int i = 0; i < 6; i++) {
                sheet.autoSizeColumn(i);
            }
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Ошибка экспорта Excel", e);
        }
    }

    public String computeCategory(Student student, double weightKg, Discipline discipline) {
        int age = AgeCalculator.age(student.getBirthDate());
        String ageGroup;
        if (age <= 8) ageGroup = "8 и младше";
        else if (age <= 10) ageGroup = "9-10";
        else if (age <= 12) ageGroup = "11-12";
        else if (age <= 14) ageGroup = "13-14";
        else ageGroup = "15+";

        String weightClass;
        if (weightKg < 30) weightClass = "-30";
        else if (weightKg < 35) weightClass = "30-34";
        else if (weightKg < 40) weightClass = "35-39";
        else if (weightKg < 45) weightClass = "40-44";
        else weightClass = "45+";

        return ageGroup + " / " + weightClass + " / " + discipline.name();
    }

    public RegistrationDto toRegistrationDto(CompetitionRegistration reg) {
        Student s = reg.getStudent();
        return RegistrationDto.builder()
                .id(reg.getId())
                .studentId(s.getId())
                .studentName(s.getFirstName() + " " + s.getLastName())
                .age(AgeCalculator.age(s.getBirthDate()))
                .weightKg(reg.getWeightKg())
                .discipline(reg.getDiscipline())
                .rsvpStatus(reg.getRsvpStatus())
                .autoCategory(reg.getAutoCategory())
                .effectiveCategory(effectiveCategory(reg))
                .build();
    }

    private CompetitionDto toCompetitionDto(Competition c) {
        List<RegistrationDto> regs = registrationRepository.findByCompetitionId(c.getId()).stream()
                .map(this::toRegistrationDto)
                .toList();
        return CompetitionDto.builder()
                .id(c.getId())
                .name(c.getName())
                .eventDate(c.getEventDate())
                .location(c.getLocation())
                .description(c.getDescription())
                .registrations(regs)
                .build();
    }

    private String effectiveCategory(CompetitionRegistration reg) {
        if (reg.getCoachOverrideCategory() != null && !reg.getCoachOverrideCategory().isBlank()) {
            return reg.getCoachOverrideCategory();
        }
        return reg.getAutoCategory();
    }
}
