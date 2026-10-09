# notification-service — DTOs

Package: `com.clinicflow.notification.dto`

---

## NotificationDTO

**Direction:** Request / Response

| Field | Type | Notes |
|-------|------|-------|
| `notificationId` | `Long` | Response only |
| `userId` | `Long` | Recipient user ID |
| `patientId` | `Long` | Associated patient (optional) |
| `entityId` | `Long` | ID of the related entity (encounter, appointment, etc.) |
| `message` | `String` | Notification body text |
| `category` | `String` | e.g. `"APPOINTMENT"`, `"LAB_RESULT"` |
| `channel` | `Notification.Channel` | Enum: delivery channel (e.g. `EMAIL`, `SMS`, `IN_APP`) |
| `severity` | `String` | e.g. `"INFO"`, `"WARNING"`, `"CRITICAL"` |
| `createdAt` | `LocalDateTime` | |
| `readAt` | `LocalDateTime` | Null until the user reads the notification |
| `status` | `String` | e.g. `"SENT"`, `"READ"`, `"FAILED"` |

---

## TaskDTO

**Direction:** Request / Response

| Field | Type | Notes |
|-------|------|-------|
| `taskId` | `Long` | Response only |
| `assignedTo` | `Long` | User ID of the assignee |
| `relatedEntityId` | `Long` | ID of the related entity |
| `description` | `String` | |
| `dueDate` | `LocalDateTime` | |
| `priority` | `String` | e.g. `"LOW"`, `"MEDIUM"`, `"HIGH"` |
| `createdAt` | `LocalDateTime` | |
| `completedAt` | `LocalDateTime` | Null until completed |
| `status` | `String` | e.g. `"OPEN"`, `"IN_PROGRESS"`, `"DONE"` |
