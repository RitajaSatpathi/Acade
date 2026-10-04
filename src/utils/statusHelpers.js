export function getStatusBadgeClass(status) {
  switch (status) {
    case 'submitted': return 'bg-blue-100 text-blue-700'
    case 'reviewed': return 'bg-success-100 text-success-700'
    case 'overdue': return 'bg-error-100 text-error-700'
    case 'pending': return 'bg-warning-100 text-warning-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

export function getProficiencyColor(proficiency) {
  switch (proficiency) {
    case 'Expert': return 'bg-accent-100 text-accent-700'
    case 'Advanced': return 'bg-primary-100 text-primary-700'
    case 'Intermediate': return 'bg-blue-100 text-blue-700'
    case 'Beginner': return 'bg-slate-100 text-slate-600'
    default: return 'bg-slate-100 text-slate-600'
  }
}

export function getAssessmentTypeColor(type) {
  switch (type) {
    case 'quiz': return 'bg-accent-100 text-accent-700'
    case 'class_test': return 'bg-blue-100 text-blue-700'
    case 'internal_assessment': return 'bg-primary-100 text-primary-700'
    default: return 'bg-slate-100 text-slate-600'
  }
}

export function getAssessmentTypeLabel(type) {
  switch (type) {
    case 'quiz': return 'Quiz'
    case 'class_test': return 'Class Test'
    case 'internal_assessment': return 'Internal Assessment'
    default: return type
  }
}
