package com.seishin.web.dto.coach;

import com.seishin.web.dto.common.StudentSummaryDto;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CoachDashboardDto {
    private int totalStudents;
    private int totalGroups;
    private int upcomingBirthdays;
    private int pendingPayments;
    private int pendingCompetitionRsvps;
    private List<StudentSummaryDto> birthdayStudents;
    private List<GroupSummaryDto> groups;
    private ClassEventDto nextClass;
}
