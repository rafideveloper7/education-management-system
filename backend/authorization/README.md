# Authorization

Authorization is separate from authentication. Authenticate first, check the action permission second, and then check the relationship between the authenticated user and the specific resource.

## Structure

```text
authorization/
  config/role-permissions.js
  constants/permissions.constants.js
  constants/roles.constants.js
  middleware/permission.middleware.js
  middleware/resource-access.middleware.js
  policies/result.policy.js
  policies/student-record.policy.js
  services/permission.service.js
  services/relationship-access.service.js
  services/relationship-lifecycle.service.js
  test/authorization.test.js
  index.js
models/
  parent/ParentStudent.js
  student/StudentEnrollment.js
  teacher/TeacherAssignment.js
```

Relationship records are historical records. Close them by setting a terminal status and `validTo`; do not delete them. Parent links use `ACTIVE`, `ENDED`, or `DECEASED`; enrollments use `ACTIVE`, `COMPLETED`, `ENDED`, or `SUSPENDED`; teaching assignments use `ACTIVE`, `ENDED`, or `CANCELLED`.

## Resource Route Integration

The resource loader must fetch the resource from the database. It must translate any institutional student identifier to that student's `User._id` and must return the resource session, class, section, optional subject, and the resource's event/creation date. Do not accept these values or relationship facts from request input.

```js
const { authenticate } = require('../middleware/auth.middleware');
const {
  PERMISSIONS,
  requirePermissions,
  requireResourceAccess,
  createRelationshipContextResolver,
  canAccessStudentRecord,
} = require('../authorization');

const resolveAttendanceContext = createRelationshipContextResolver({
  resolveResource: async (req) => {
    const attendance = await attendanceService.findById(req.params.attendanceId);
    if (!attendance) return null;

    return {
      studentUserId: attendance.studentUserId,
      academicSessionId: attendance.academicSessionId,
      classId: attendance.classId,
      sectionId: attendance.sectionId,
      occurredAt: attendance.attendanceDate,
    };
  },
});

router.get(
  '/attendance/:attendanceId',
  authenticate,
  requirePermissions(PERMISSIONS.ATTENDANCE_VIEW),
  requireResourceAccess({
    resolveContext: resolveAttendanceContext,
    policy: canAccessStudentRecord,
  }),
  attendanceController.getById,
);
```

The resolver checks the authenticated student's enrollment for the same session/class/section and resource date; a parent's active relationship to the requested student; or a teacher assignment for that session/class/section and, when present, subject. Historical student enrollments and teacher assignments can authorize historical resources only when their effective date range covers the resource date. Ended parent links do not grant current child access. Admin access still passes through the endpoint's action permission.

The backend currently has no student profile, academic session, class, section, subject, attendance, or result models/routes. The relationship models therefore store academic references as ObjectIds and link parent/student/teacher identities to the existing `User._id`. Future domain models should register those references and provide the trusted resource loader shown above.

## Result Entry

Use `canEnterResult` as the resource policy after resolving the result from the database and running the relationship context resolver. It requires `RESULT_ENTER`, a teacher assignment matching session/class/section/subject and result date, and a non-published result. Never pass assignment IDs supplied by the client.

## Relationship Lifecycle

`createRelationshipLifecycleService()` exposes `closeParentStudent`, `closeStudentEnrollment`, and `closeTeacherAssignment`. These operations atomically transition an active row and set `validTo`, preserving the record for history. An invalid or already-closed relationship returns `null`; unsupported transitions throw a `TypeError`.

## Validation

From the workspace root, run `node --test backend/authorization/test/authorization.test.js`.