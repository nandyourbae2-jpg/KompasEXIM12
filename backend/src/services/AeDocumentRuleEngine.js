class AeDocumentRuleEngine {
  static getDocumentMapping() {
    return [
      {
        document: 'SCHEDULE INTERNAL',
        activities: ['RCVD', 'SERVER FILING', 'CHECKED']
      },
      {
        document: 'DO INTERNAL',
        activities: ['Prep', 'Soft', 'Final', 'Draft', 'Original']
      },
      {
        document: 'DO LINER',
        activities: ['Prep', 'Soft', 'Final', 'Draft', 'Original']
      },
      {
        document: 'DATA FORWARDER',
        activities: ['Prep', 'Soft', 'Final', 'Draft', 'Original']
      },
      {
        document: 'DATA LOADING',
        activities: ['Prep', 'Soft', 'Final', 'Draft', 'Original']
      },
      {
        document: 'PI',
        activities: ['Prep', 'Soft', 'Final', 'Draft', 'Original']
      },
      {
        document: 'SHIPPING INSTRUCTION',
        activities: ['Prep', 'Soft', 'Final', 'Draft', 'Original']
      },
      {
        document: 'L/C',
        activities: ['Prep', 'Soft', 'Final', 'Draft', 'Original']
      },
      {
        document: 'SI',
        activities: ['FORMAT STANDARD', 'EMAIL TO INTERNAL', 'FWDR']
      },
      {
        document: 'INVOICE',
        activities: ['FORMAT STANDARD', 'EMAIL TO INTERNAL']
      },
      {
        document: 'PACKING LIST',
        activities: ['FORMAT STANDARD']
      },
      {
        document: 'LOI',
        activities: ['FORMAT STANDARD']
      },
      {
        document: 'PEB',
        activities: ['Confirm Draft', 'NPE & PEB received']
      },
      {
        document: 'PL',
        activities: ['CNF/CIF All In']
      },
      {
        document: 'BL',
        activities: ['DRAFT', 'FINAL', 'ORIGINAL']
      },
      {
        document: 'COO',
        activities: ['DRAFT', 'FINAL', 'ORIGINAL']
      },
      {
        document: 'VGM',
        activities: ['LINER by Web']
      },
      {
        document: 'SBU',
        activities: ['RECEIVED']
      }
    ];
  }

  static deriveDocumentState(documentName, activities) {
    // If no activities, default MISSING
    if (!activities || activities.length === 0) return 'MISSING';

    // Map activities by status
    const statusMap = {};
    activities.forEach(a => {
      statusMap[a.activity_name.toUpperCase()] = a.status;
    });

    const isCompleted = (act) => statusMap[act] === 'COMPLETED';

    // State derivation logic for standard 5 stages (Prep, Soft, Final, Draft, Original)
    if (isCompleted('ORIGINAL')) return 'ORIGINAL';
    if (isCompleted('DRAFT') || isConfirmDraft(statusMap)) return 'DRAFT';
    if (isCompleted('FINAL')) return 'FINAL';
    if (isCompleted('SOFT')) return 'DRAFT';
    if (isCompleted('PREP')) return 'DRAFT';

    if (isCompleted('CHECKED')) return 'RECEIVED'; // Checked means it was received
    if (isCompleted('RCVD') || isCompleted('RECEIVED')) return 'RECEIVED';

    return 'MISSING';
  }
}

function isConfirmDraft(map) {
  return map['CONFIRM DRAFT'] === 'COMPLETED';
}

module.exports = AeDocumentRuleEngine;
