import sys

with open('src/services/AeWorkflowEngine.js', 'r') as f:
    content = f.read()

# I will replace the terminal state and add QC ATTEND logic
# Let's find the logic for `nextAction = 'All Activities Completed';`

old_state_logic = """        if (nextActivity) {
           nextAction = `Execute: ${nextActivity.activity_name}`;
           currentStage = nextActivity.activity_name.split(' - ')[0] || currentStage;
           pendingActionObj = nextActivity;
        } else {
           nextAction = 'All Activities Completed';
           currentStage = 'ORIGINAL'; // Or Handover Ready
        }"""

new_state_logic = """        if (nextActivity) {
           nextAction = `Execute: ${nextActivity.activity_name}`;
           currentStage = nextActivity.activity_name.split(' - ')[0] || currentStage;
           pendingActionObj = nextActivity;
        } else {
           // Determine exact terminal state based on handover status
           if (job.ae_handover_status === 'Final Shared') {
               nextAction = 'READY FOR CLOSURE';
           } else if (job.ae_handover_status === 'Draft Shared') {
               nextAction = 'READY FOR FINAL HANDOVER';
           } else {
               nextAction = 'READY FOR DRAFT HANDOVER';
           }
           currentStage = 'HANDOVER';
        }"""

if old_state_logic in content:
    content = content.replace(old_state_logic, new_state_logic)

# Now, add QC ATTEND applicability flag to the response
old_return = """    return {
      currentStage: isBlocked ? `${currentStage} (BLOCKED)` : currentStage,
      nextAction: nextAction || 'Pending',
      priority,
      blocker: activeBlocker || null,
      pendingActionObj
    };"""

new_return = """    // Simulate business rule evaluation for QC ATTEND applicability
    let qcAttendApplicable = false;
    // Example rule: Buyer is one of the configured list AND product type is WR
    const qcBuyers = ['TMI', 'HDE', 'ITOCHU', 'KIBU', 'JAIS', 'POP', 'PBN'];
    if (job.buyer && qcBuyers.some(b => job.buyer.toUpperCase().includes(b)) && job.product_type === 'WR') {
        qcAttendApplicable = true;
    }

    return {
      currentStage: isBlocked ? `${currentStage} (BLOCKED)` : currentStage,
      nextAction: nextAction || 'Pending',
      priority,
      blocker: activeBlocker || null,
      pendingActionObj,
      qcAttendApplicable
    };"""

if old_return in content:
    content = content.replace(old_return, new_return)

with open('src/services/AeWorkflowEngine.js', 'w') as f:
    f.write(content)
print("Patched AeWorkflowEngine")
