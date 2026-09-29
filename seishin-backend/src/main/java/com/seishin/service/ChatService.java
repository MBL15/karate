package com.seishin.service;



import com.seishin.domain.entity.*;

import com.seishin.domain.enums.ChatThreadKind;

import com.seishin.domain.enums.Role;

import com.seishin.repository.*;

import com.seishin.security.UserPrincipal;

import com.seishin.web.dto.chat.ChatMessageDto;

import com.seishin.web.dto.chat.ChatThreadDto;

import com.seishin.web.dto.chat.CreateChatGroupDto;

import com.seishin.web.dto.chat.SendChatMessageDto;

import com.seishin.web.exception.BadRequestException;

import com.seishin.web.exception.ForbiddenException;

import com.seishin.web.exception.NotFoundException;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;



import java.time.Instant;

import java.util.*;

import java.util.stream.Collectors;



@Service

@RequiredArgsConstructor

@Transactional(readOnly = true)

public class ChatService {



    private final ChatMessageRepository chatMessageRepository;

    private final ChatGroupRepository chatGroupRepository;

    private final ChatGroupMemberRepository chatGroupMemberRepository;

    private final ChatGroupMessageRepository chatGroupMessageRepository;

    private final ParentAccessService parentAccessService;

    private final StudentRepository studentRepository;

    private final ParentStudentLinkRepository parentStudentLinkRepository;

    private final TrainingGroupRepository trainingGroupRepository;

    private final GroupStudentRepository groupStudentRepository;

    private final UserRepository userRepository;



    public List<ChatThreadDto> listThreadsForCoach(UserPrincipal coach, String query) {

        List<ChatThreadDto> threads = new ArrayList<>();

        studentRepository.findByClubId(coach.getClubId()).forEach(student -> threads.add(buildStudentThread(student)));

        chatGroupRepository.findByClubId(coach.getClubId()).stream()

                .filter(group -> chatGroupMemberRepository.existsByGroupIdAndUserId(group.getId(), coach.getId()))

                .forEach(group -> threads.add(buildGroupThread(group)));

        threads.sort(threadComparator());

        return filterThreads(threads, query, coach.getClubId());

    }



    public List<ChatThreadDto> listThreadsForParent(UserPrincipal parent, String query) {

        List<ChatThreadDto> threads = new ArrayList<>();

        parentStudentLinkRepository.findByParentId(parent.getId()).forEach(link ->

                threads.add(buildStudentThread(link.getStudent())));

        chatGroupMemberRepository.findByUserId(parent.getId()).forEach(member ->

                threads.add(buildGroupThread(member.getGroup())));

        threads.sort(threadComparator());

        Long clubId = threads.stream()

                .map(this::clubIdForThread)

                .filter(Objects::nonNull)

                .findFirst()

                .orElse(null);

        return filterThreads(threads, query, clubId);

    }



    @Transactional(readOnly = false)

    public ChatThreadDto createGroupForCoach(UserPrincipal coach, CreateChatGroupDto dto) {

        User creator = userRepository.findById(coach.getId())

                .orElseThrow(() -> new NotFoundException("Пользователь не найден"));

        Club club = creator.getClub();

        if (club == null) {

            throw new BadRequestException("Тренер не привязан к клубу");

        }



        Set<Long> memberIds = new LinkedHashSet<>();

        memberIds.add(coach.getId());



        if (dto.getTrainingGroupId() != null) {

            TrainingGroup trainingGroup = trainingGroupRepository.findById(dto.getTrainingGroupId())

                    .orElseThrow(() -> new NotFoundException("Тренировочная группа не найдена"));

            if (!trainingGroup.getClub().getId().equals(club.getId())) {

                throw new NotFoundException("Тренировочная группа не найдена");

            }

            for (GroupStudent groupStudent : groupStudentRepository.findByGroupId(trainingGroup.getId())) {

                parentStudentLinkRepository.findByStudentId(groupStudent.getStudent().getId()).stream()

                        .map(link -> link.getParent().getId())

                        .forEach(memberIds::add);

            }

        }



        if (dto.getParentIds() != null) {

            for (Long parentId : dto.getParentIds()) {

                User parent = userRepository.findById(parentId)

                        .orElseThrow(() -> new NotFoundException("Родитель не найден: " + parentId));

                if (parent.getRole() != Role.PARENT) {

                    throw new BadRequestException("Участник должен быть родителем");

                }

                memberIds.add(parentId);

            }

        }



        if (memberIds.size() < 2) {

            throw new BadRequestException("Выберите тренировочную группу или родителей для группового чата");

        }



        ChatGroup group = chatGroupRepository.save(ChatGroup.builder()

                .name(dto.getName().trim())

                .club(club)

                .createdBy(creator)

                .createdAt(Instant.now())

                .build());



        for (Long memberId : memberIds) {

            User user = userRepository.findById(memberId)

                    .orElseThrow(() -> new NotFoundException("Пользователь не найден"));

            chatGroupMemberRepository.save(ChatGroupMember.builder().group(group).user(user).build());

        }



        return buildGroupThread(group);

    }



    public List<ChatMessageDto> listForParent(UserPrincipal parent, Long studentId) {

        parentAccessService.requireLinkedChild(parent, studentId);

        return chatMessageRepository.findByStudentIdOrderBySentAtAsc(studentId).stream()

                .map(message -> toStudentDto(message, parent.getId()))

                .toList();

    }



    @Transactional(readOnly = false)

    public ChatMessageDto sendForParent(UserPrincipal parent, Long studentId, SendChatMessageDto dto) {

        Student student = parentAccessService.requireLinkedChild(parent, studentId);

        User sender = userRepository.findById(parent.getId())

                .orElseThrow(() -> new NotFoundException("Пользователь не найден"));

        ChatMessage saved = chatMessageRepository.save(buildStudentMessage(student, sender, dto.getBody()));

        return toStudentDto(saved, parent.getId());

    }



    public List<ChatMessageDto> listGroupForParent(UserPrincipal parent, Long groupId) {

        requireGroupMember(groupId, parent.getId());

        return listGroupMessages(groupId, parent.getId());

    }



    @Transactional(readOnly = false)

    public ChatMessageDto sendGroupForParent(UserPrincipal parent, Long groupId, SendChatMessageDto dto) {

        requireGroupMember(groupId, parent.getId());

        ChatGroup group = chatGroupRepository.findById(groupId)

                .orElseThrow(() -> new NotFoundException("Групповой чат не найден"));

        User sender = userRepository.findById(parent.getId())

                .orElseThrow(() -> new NotFoundException("Пользователь не найден"));

        ChatGroupMessage saved = chatGroupMessageRepository.save(buildGroupMessage(group, sender, dto.getBody()));

        return toGroupDto(saved, parent.getId());

    }



    public List<ChatMessageDto> listForCoach(UserPrincipal coach, Long studentId) {

        requireCoachStudent(coach, studentId);

        return chatMessageRepository.findByStudentIdOrderBySentAtAsc(studentId).stream()

                .map(message -> toStudentDto(message, coach.getId()))

                .toList();

    }



    @Transactional(readOnly = false)

    public ChatMessageDto sendForCoach(UserPrincipal coach, Long studentId, SendChatMessageDto dto) {

        Student student = requireCoachStudent(coach, studentId);

        User sender = userRepository.findById(coach.getId())

                .orElseThrow(() -> new NotFoundException("Пользователь не найден"));

        ChatMessage saved = chatMessageRepository.save(buildStudentMessage(student, sender, dto.getBody()));

        return toStudentDto(saved, coach.getId());

    }



    public List<ChatMessageDto> listGroupForCoach(UserPrincipal coach, Long groupId) {

        requireCoachGroup(coach, groupId);

        return listGroupMessages(groupId, coach.getId());

    }



    @Transactional(readOnly = false)

    public ChatMessageDto sendGroupForCoach(UserPrincipal coach, Long groupId, SendChatMessageDto dto) {

        requireCoachGroup(coach, groupId);

        ChatGroup group = chatGroupRepository.findById(groupId)

                .orElseThrow(() -> new NotFoundException("Групповой чат не найден"));

        User sender = userRepository.findById(coach.getId())

                .orElseThrow(() -> new NotFoundException("Пользователь не найден"));

        ChatGroupMessage saved = chatGroupMessageRepository.save(buildGroupMessage(group, sender, dto.getBody()));

        return toGroupDto(saved, coach.getId());

    }



    private List<ChatMessageDto> listGroupMessages(Long groupId, Long currentUserId) {

        return chatGroupMessageRepository.findByGroupIdOrderBySentAtAsc(groupId).stream()

                .map(message -> toGroupDto(message, currentUserId))

                .toList();

    }



    private List<ChatThreadDto> filterThreads(List<ChatThreadDto> threads, String query, Long clubId) {

        if (query == null || query.isBlank()) {

            return threads;

        }

        String needle = query.trim().toLowerCase(Locale.ROOT);

        Set<Long> studentIdsFromMessages = clubId == null ? Set.of()

                : new HashSet<>(chatMessageRepository.findStudentIdsWithMatchingMessages(clubId, needle));

        Set<Long> groupIdsFromMessages = clubId == null ? Set.of()

                : new HashSet<>(chatGroupMessageRepository.findGroupIdsWithMatchingMessages(clubId, needle));



        return threads.stream()

                .filter(thread -> matchesSearch(thread, needle, studentIdsFromMessages, groupIdsFromMessages))

                .toList();

    }



    private boolean matchesSearch(

            ChatThreadDto thread,

            String needle,

            Set<Long> studentIdsFromMessages,

            Set<Long> groupIdsFromMessages) {

        if (contains(thread.getTitle(), needle) || contains(thread.getSubtitle(), needle) || contains(thread.getLastMessage(), needle)) {

            return true;

        }

        if (thread.getKind() == ChatThreadKind.STUDENT && thread.getStudentId() != null) {

            return studentIdsFromMessages.contains(thread.getStudentId());

        }

        if (thread.getKind() == ChatThreadKind.GROUP && thread.getGroupId() != null) {

            return groupIdsFromMessages.contains(thread.getGroupId());

        }

        return false;

    }



    private boolean contains(String value, String needle) {

        return value != null && value.toLowerCase(Locale.ROOT).contains(needle);

    }



    private Comparator<ChatThreadDto> threadComparator() {

        return Comparator.comparing(ChatThreadDto::getLastMessageAt, Comparator.nullsLast(Comparator.reverseOrder()))

                .thenComparing(ChatThreadDto::getTitle, Comparator.nullsLast(String::compareToIgnoreCase));

    }



    private Long clubIdForThread(ChatThreadDto thread) {

        if (thread.getKind() == ChatThreadKind.STUDENT && thread.getStudentId() != null) {

            return studentRepository.findById(thread.getStudentId())

                    .map(student -> student.getClub().getId())

                    .orElse(null);

        }

        if (thread.getKind() == ChatThreadKind.GROUP && thread.getGroupId() != null) {

            return chatGroupRepository.findById(thread.getGroupId())

                    .map(group -> group.getClub().getId())

                    .orElse(null);

        }

        return null;

    }



    private Student requireCoachStudent(UserPrincipal coach, Long studentId) {

        Student student = studentRepository.findById(studentId)

                .orElseThrow(() -> new NotFoundException("Ученик не найден"));

        if (!student.getClub().getId().equals(coach.getClubId())) {

            throw new NotFoundException("Ученик не найден");

        }

        return student;

    }



    private ChatGroup requireCoachGroup(UserPrincipal coach, Long groupId) {

        ChatGroup group = chatGroupRepository.findById(groupId)

                .orElseThrow(() -> new NotFoundException("Групповой чат не найден"));

        if (!group.getClub().getId().equals(coach.getClubId())) {

            throw new NotFoundException("Групповой чат не найден");

        }

        if (!chatGroupMemberRepository.existsByGroupIdAndUserId(groupId, coach.getId())) {

            throw new ForbiddenException("Нет доступа к групповому чату");

        }

        return group;

    }



    private void requireGroupMember(Long groupId, Long userId) {

        if (!chatGroupMemberRepository.existsByGroupIdAndUserId(groupId, userId)) {

            throw new ForbiddenException("Нет доступа к групповому чату");

        }

    }



    private ChatThreadDto buildStudentThread(Student student) {

        var lastMessage = chatMessageRepository.findTopByStudentIdOrderBySentAtDesc(student.getId()).orElse(null);

        String parentName = parentStudentLinkRepository.findByStudentId(student.getId()).stream()

                .map(link -> link.getParent().getName())

                .collect(Collectors.joining(", "));

        if (parentName.isBlank()) {

            parentName = "Родитель не привязан";

        }



        return ChatThreadDto.builder()

                .kind(ChatThreadKind.STUDENT)

                .studentId(student.getId())

                .title(student.getFirstName() + " " + student.getLastName())

                .subtitle(parentName)

                .lastMessage(lastMessage != null ? lastMessage.getBody() : null)

                .lastMessageAt(lastMessage != null ? lastMessage.getSentAt() : null)

                .lastSenderRole(lastMessage != null ? lastMessage.getSender().getRole() : null)

                .build();

    }



    private ChatThreadDto buildGroupThread(ChatGroup group) {

        var lastMessage = chatGroupMessageRepository.findTopByGroupIdOrderBySentAtDesc(group.getId()).orElse(null);

        int memberCount = chatGroupMemberRepository.countByGroupId(group.getId());



        return ChatThreadDto.builder()

                .kind(ChatThreadKind.GROUP)

                .groupId(group.getId())

                .title(group.getName())

                .subtitle(memberCount + " " + membersLabel(memberCount))

                .memberCount(memberCount)

                .lastMessage(lastMessage != null ? lastMessage.getBody() : null)

                .lastMessageAt(lastMessage != null ? lastMessage.getSentAt() : null)

                .lastSenderRole(lastMessage != null ? lastMessage.getSender().getRole() : null)

                .build();

    }



    private String membersLabel(int count) {

        int mod10 = count % 10;

        int mod100 = count % 100;

        if (mod10 == 1 && mod100 != 11) return "участник";

        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "участника";

        return "участников";

    }



    private ChatMessage buildStudentMessage(Student student, User sender, String body) {

        return ChatMessage.builder()

                .student(student)

                .sender(sender)

                .body(body.trim())

                .sentAt(Instant.now())

                .build();

    }



    private ChatGroupMessage buildGroupMessage(ChatGroup group, User sender, String body) {

        return ChatGroupMessage.builder()

                .group(group)

                .sender(sender)

                .body(body.trim())

                .sentAt(Instant.now())

                .build();

    }



    private ChatMessageDto toStudentDto(ChatMessage message, Long currentUserId) {

        User sender = message.getSender();

        return ChatMessageDto.builder()

                .id(message.getId())

                .studentId(message.getStudent().getId())

                .senderId(sender.getId())

                .senderName(sender.getName())

                .senderRole(sender.getRole())

                .body(message.getBody())

                .sentAt(message.getSentAt())

                .mine(sender.getId().equals(currentUserId))

                .build();

    }



    private ChatMessageDto toGroupDto(ChatGroupMessage message, Long currentUserId) {

        User sender = message.getSender();

        return ChatMessageDto.builder()

                .id(message.getId())

                .groupId(message.getGroup().getId())

                .senderId(sender.getId())

                .senderName(sender.getName())

                .senderRole(sender.getRole())

                .body(message.getBody())

                .sentAt(message.getSentAt())

                .mine(sender.getId().equals(currentUserId))

                .build();

    }

}


