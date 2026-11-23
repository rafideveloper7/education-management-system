// Admission Report Service
// Section 5.10: Reports, analytics, and audit history

const AdmissionApplication = require('../../models/admission/AdmissionApplication');
const AdmissionHistory = require('../../models/admission/AdmissionHistory');
const AdmissionConfiguration = require('../../models/admission/AdmissionConfiguration');
const { ApiError } = require('../../utils/ApiError');

class AdmissionReportService {
  // Get admission dashboard statistics
  async getDashboardStats(academicSessionId = null) {
    const matchStage = academicSessionId ? { 'configuration.academicSessionId': academicSessionId } : {};

    // Application status statistics
    const [statusStats, decisionStats, trendData, configStats] = await Promise.all([
      this.getStatusStatistics(academicSessionId),
      this.getDecisionStatistics(academicSessionId),
      this.getAdmissionTrends(academicSessionId),
      this.getConfigurationStatistics(academicSessionId),
    ]);

    // Calculate conversion rates
    const totalSubmitted = statusStats.byStatus.SUBMITTED || 0;
    const totalApproved = statusStats.byStatus.APPROVED || 0;
    const totalEnrolled = statusStats.byStatus.ENROLLED || 0;

    const approvalRate = totalSubmitted > 0 ? (totalApproved / totalSubmitted) * 100 : 0;
    const enrollmentRate = totalApproved > 0 ? (totalEnrolled / totalApproved) * 100 : 0;

    return {
      overview: {
        totalApplications: statusStats.total,
        activeConfigurations: configStats.activeCount,
        openForSubmission: configStats.openForSubmission,
      },
      statusBreakdown: statusStats.byStatus,
      decisionBreakdown: decisionStats.byDecision,
      conversionRates: {
        approvalRate: Math.round(approvalRate * 100) / 100,
        enrollmentRate: Math.round(enrollmentRate * 100) / 100,
        overallConversion: Math.round((totalEnrolled / totalSubmitted) * 100 * 100) / 100 || 0,
      },
      trends: trendData,
      configurations: configStats,
      recentActivity: await this.getRecentActivity(10),
    };
  }

  // Get status statistics
  async getStatusStatistics(academicSessionId = null) {
    const pipeline = [];

    if (academicSessionId) {
      pipeline.push(
        {
          $lookup: {
            from: 'admissionconfigurations',
            localField: 'admissionConfigurationId',
            foreignField: '_id',
            as: 'configuration',
          },
        },
        {
          $unwind: {
            path: '$configuration',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            'configuration.academicSessionId': academicSessionId,
          },
        }
      );
    }

    pipeline.push(
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0,
        },
      }
    );

    const stats = await AdmissionApplication.aggregate(pipeline);

    const result = {
      total: 0,
      byStatus: {},
    };

    stats.forEach(stat => {
      result.total += stat.count;
      result.byStatus[stat.status] = stat.count;
    });

    return result;
  }

  // Get decision statistics
  async getDecisionStatistics(academicSessionId = null) {
    const pipeline = [];

    if (academicSessionId) {
      pipeline.push(
        {
          $lookup: {
            from: 'admissionconfigurations',
            localField: 'admissionConfigurationId',
            foreignField: '_id',
            as: 'configuration',
          },
        },
        {
          $unwind: {
            path: '$configuration',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            'configuration.academicSessionId': academicSessionId,
          },
        }
      );
    }

    pipeline.push(
      {
        $group: {
          _id: '$decision',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          decision: '$_id',
          count: 1,
          _id: 0,
        },
      }
    );

    const stats = await AdmissionApplication.aggregate(pipeline);

    const result = {
      byDecision: {},
    };

    stats.forEach(stat => {
      result.byDecision[stat.decision] = stat.count;
    });

    return result;
  }

  // Get admission trends (daily/weekly/monthly)
  async getAdmissionTrends(academicSessionId = null, period = 'monthly') {
    let groupFormat;
    let dateFormat;

    switch (period) {
      case 'daily':
        groupFormat = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } };
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        groupFormat = { year: { $year: '$createdAt' }, week: { $week: '$createdAt' } };
        dateFormat = '%Y-%W';
        break;
      case 'monthly':
      default:
        groupFormat = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
        dateFormat = '%Y-%m';
        break;
    }

    const pipeline = [];

    if (academicSessionId) {
      pipeline.push(
        {
          $lookup: {
            from: 'admissionconfigurations',
            localField: 'admissionConfigurationId',
            foreignField: '_id',
            as: 'configuration',
          },
        },
        {
          $unwind: {
            path: '$configuration',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            'configuration.academicSessionId': academicSessionId,
          },
        }
      );
    }

    pipeline.push(
      {
        $group: {
          _id: groupFormat,
          applications: { $sum: 1 },
          submitted: {
            $sum: { $cond: [{ $eq: ['$status', 'SUBMITTED'] }, 1, 0] },
          },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] },
          },
          enrolled: {
            $sum: { $cond: [{ $eq: ['$status', 'ENROLLED'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          period: {
            $dateToString: {
              format: dateFormat,
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day',
                },
              },
            },
          },
          applications: 1,
          submitted: 1,
          approved: 1,
          enrolled: 1,
          _id: 0,
        },
      },
      {
        $sort: { period: 1 },
      },
      {
        $limit: 12, // Last 12 periods
      }
    );

    const trends = await AdmissionApplication.aggregate(pipeline);
    return trends;
  }

  // Get configuration statistics
  async getConfigurationStatistics(academicSessionId = null) {
    const query = { status: 'ACTIVE' };
    if (academicSessionId) {
      query.academicSessionId = academicSessionId;
    }

    const configurations = await AdmissionConfiguration.find(query)
      .populate('academicSessionId', 'name startDate endDate')
      .populate('applicableClasses', 'name gradeLevel');

    const now = new Date();
    const openForSubmission = configurations.filter(config => 
      config.submissionStartDate <= now && config.submissionEndDate >= now
    ).length;

    // Get application counts per configuration
    const configStats = await Promise.all(
      configurations.map(async (config) => {
        const applicationCount = await AdmissionApplication.countDocuments({
          admissionConfigurationId: config._id,
        });

        return {
          configurationId: config._id,
          configurationName: config.name,
          academicSession: config.academicSessionId?.name,
          applicationCount,
          isOpen: config.submissionStartDate <= now && config.submissionEndDate >= now,
        };
      })
    );

    return {
      activeCount: configurations.length,
      openForSubmission,
      configurations: configStats,
    };
  }

  // Get recent admission activity
  async getRecentActivity(limit = 10) {
    const activities = await AdmissionHistory.find()
      .populate('admissionApplicationId', 'applicationReference applicantFullName')
      .populate('actorUserId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit);

    return activities.map(activity => ({
      id: activity._id,
      actionType: activity.actionType,
      actionDescription: activity.actionDescription,
      applicationReference: activity.admissionApplicationId?.applicationReference,
      applicantName: activity.admissionApplicationId?.applicantFullName,
      actorName: activity.actorUserId?.fullName,
      actorRole: activity.actorRole,
      timestamp: activity.createdAt,
    }));
  }

  // Get detailed application audit trail
  async getApplicationAuditTrail(applicationId) {
    const history = await AdmissionHistory.find({ admissionApplicationId: applicationId })
      .populate('actorUserId', 'fullName email')
      .sort({ createdAt: -1 });

    return history.map(entry => ({
      id: entry._id,
      actionType: entry.actionType,
      actionDescription: entry.actionDescription,
      actorName: entry.actorUserId?.fullName,
      actorRole: entry.actorRole,
      timestamp: entry.createdAt,
      previousState: entry.previousState,
      newState: entry.newState,
      changedFields: entry.changedFields,
      metadata: entry.metadata,
    }));
  }

  // Generate admission report (CSV/Excel format)
  async generateAdmissionReport(filters = {}) {
    const query = {};

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.decision) {
      query.decision = filters.decision;
    }
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }
    if (filters.academicSessionId) {
      query['admissionConfigurationId.academicSessionId'] = filters.academicSessionId;
    }

    const applications = await AdmissionApplication.find(query)
      .populate('admissionConfigurationId', 'name academicSessionId')
      .populate('appliedClassId', 'name gradeLevel')
      .populate('applicantUserId', 'fullName email')
      .populate('reviewedByUserId', 'fullName')
      .populate('decidedByUserId', 'fullName')
      .populate('onboardedStudentUserId', 'fullName email')
      .sort({ createdAt: -1 });

    // Format data for report
    const reportData = applications.map(app => ({
      'Application Reference': app.applicationReference,
      'Applicant Name': app.applicantFullName,
      'Applicant Email': app.applicantEmail,
      'Applicant Phone': app.applicantPhone,
      'Date of Birth': app.applicantDateOfBirth?.toISOString().split('T')[0],
      'Gender': app.applicantGender,
      'Applied Class': app.appliedClassId?.name,
      'Status': app.status,
      'Decision': app.decision,
      'Submission Date': app.submissionDate?.toISOString().split('T')[0],
      'Review Date': app.reviewedAt?.toISOString().split('T')[0],
      'Reviewer': app.reviewedByUserId?.fullName,
      'Decision Date': app.decidedAt?.toISOString().split('T')[0],
      'Decision By': app.decidedByUserId?.fullName,
      'Onboarding Date': app.onboardedAt?.toISOString().split('T')[0],
      'Enrollment Date': app.enrolledAt?.toISOString().split('T')[0],
      'Enrolled Class': app.enrolledClassId?.toString(),
      'Enrolled Section': app.enrolledSectionId?.toString(),
      'Created At': app.createdAt.toISOString().split('T')[0],
    }));

    return {
      data: reportData,
      total: applications.length,
      generatedAt: new Date().toISOString(),
      filters,
    };
  }

  // Get class-wise admission statistics
  async getClassWiseStatistics(academicSessionId = null) {
    const pipeline = [];

    if (academicSessionId) {
      pipeline.push(
        {
          $lookup: {
            from: 'admissionconfigurations',
            localField: 'admissionConfigurationId',
            foreignField: '_id',
            as: 'configuration',
          },
        },
        {
          $unwind: {
            path: '$configuration',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            'configuration.academicSessionId': academicSessionId,
          },
        }
      );
    }

    pipeline.push(
      {
        $lookup: {
          from: 'classes',
          localField: 'appliedClassId',
          foreignField: '_id',
          as: 'class',
        },
      },
      {
        $unwind: {
          path: '$class',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: {
            classId: '$appliedClassId',
            className: '$class.name',
            gradeLevel: '$class.gradeLevel',
          },
          totalApplications: { $sum: 1 },
          submitted: {
            $sum: { $cond: [{ $eq: ['$status', 'SUBMITTED'] }, 1, 0] },
          },
          underReview: {
            $sum: { $cond: [{ $eq: ['$status', 'UNDER_REVIEW'] }, 1, 0] },
          },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] },
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'REJECTED'] }, 1, 0] },
          },
          enrolled: {
            $sum: { $cond: [{ $eq: ['$status', 'ENROLLED'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          classId: '$_id.classId',
          className: '$_id.className',
          gradeLevel: '$_id.gradeLevel',
          totalApplications: 1,
          submitted: 1,
          underReview: 1,
          approved: 1,
          rejected: 1,
          enrolled: 1,
          approvalRate: {
            $multiply: [
              { $divide: ['$approved', { $max: [1, '$submitted'] }] },
              100,
            ],
          },
          enrollmentRate: {
            $multiply: [
              { $divide: ['$enrolled', { $max: [1, '$approved'] }] },
              100,
            ],
          },
          _id: 0,
        },
      },
      {
        $sort: { gradeLevel: 1, className: 1 },
      }
    );

    const classStats = await AdmissionApplication.aggregate(pipeline);
    return classStats;
  }
}

module.exports = new AdmissionReportService();