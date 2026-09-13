package auth

// Permission represents an atomic authorization privilege in the ORCUS system
type Permission string

const (
	PermManageSystem         Permission = "system:manage"
	PermManageUsers          Permission = "users:manage"
	PermViewAuditLogs        Permission = "audit:view"
	PermIntakeComplaint      Permission = "complaint:intake"
	PermAssessComplaint      Permission = "complaint:assess"
	PermApproveIntake        Permission = "intake:approve"
	PermManageCases          Permission = "cases:manage"
	PermAssignInvestigator   Permission = "cases:assign"
	PermInvestigateCase      Permission = "cases:investigate"
	PermManageEvidence       Permission = "evidence:manage"
	PermSuperviseCase        Permission = "cases:supervise"
	PermApproveClosure       Permission = "cases:approve_closure"
	PermViewReports          Permission = "reports:view"
	PermTrackPublicComplaint Permission = "public:track"
)

// RolePermissions defines the authoritative role-permission mapping
var RolePermissions = map[string][]Permission{
	"Administrator": {
		PermManageSystem,
		PermManageUsers,
		PermViewAuditLogs,
		PermViewReports,
	},
	"Duty Officer": {
		PermIntakeComplaint,
		PermAssessComplaint,
		PermViewReports,
	},
	"Officer-in-Charge": {
		PermApproveIntake,
		PermManageCases,
		PermAssignInvestigator,
		PermSuperviseCase,
		PermViewReports,
	},
	"Investigating Officer": {
		PermInvestigateCase,
		PermManageEvidence,
		PermViewReports,
	},
	"Evidence Officer": {
		PermManageEvidence,
		PermViewReports,
	},
	"Supervising Officer": {
		PermSuperviseCase,
		PermApproveClosure,
		PermViewReports,
	},
	"System Auditor": {
		PermViewAuditLogs,
		PermViewReports,
	},
	"Public Complainant": {
		PermTrackPublicComplaint,
	},
	// Backward compatibility aliases for legacy prototype roles
	"Lead Investigator": {
		PermManageCases,
		PermInvestigateCase,
		PermViewReports,
	},
	"Field Detective": {
		PermInvestigateCase,
		PermIntakeComplaint,
		PermViewReports,
	},
	"Forensic Specialist": {
		PermManageEvidence,
		PermViewReports,
	},
}

// HasPermission checks if any of the user's roles grant the required permission
func HasPermission(userRoles []string, perm Permission) bool {
	for _, role := range userRoles {
		allowedPerms, exists := RolePermissions[role]
		if !exists {
			continue
		}
		for _, p := range allowedPerms {
			if p == perm {
				return true
			}
		}
	}
	return false
}

// HasAnyRole checks if user possesses at least one of the listed roles
func HasAnyRole(userRoles []string, allowedRoles ...string) bool {
	for _, ur := range userRoles {
		for _, ar := range allowedRoles {
			if ur == ar {
				return true
			}
		}
	}
	return false
}
