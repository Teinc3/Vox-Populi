import { prop, getModelForClass } from '@typegoose/typegoose';

import { PoliticalBranchType } from '../../types/types.js';

class PoliticalPermissions {
    @prop({ required: true })
    type!: PoliticalBranchType; // an Enum
}

class LegislativePermissions extends PoliticalPermissions {
    type = PoliticalBranchType.Legislative;

    // Bills
    @prop({ required: true })
    canIntroduceBill: boolean = false; // This one also applies to referendums

    @prop({ required: true })
    canVoteBill: boolean = false;

    @prop({ required: true })
    canAmendBill: boolean = false;

    // Referendums
    @prop({ required: true })
    canVoteReferendum: boolean = false;

    // Elections
    @prop({ required: true })
    canVoteHOS: boolean = false;

    @prop({ required: true })
    canVoteSenators: boolean = false;

    // Petitions
    @prop({ required: true })
    canCreatePetition: boolean = false;

    @prop({ required: true })
    canSignPetition: boolean = false;
}

class ExecutivePermissions extends PoliticalPermissions {
    type = PoliticalBranchType.Executive;

    // Emergency Powers
    @prop({ required: true })
    canInvokeEmergency: boolean = false;

    // Moderation
    @prop({ required: true })
    canManageMembership: boolean = false;

    @prop({ required: true })
    canTimeout: boolean = false;

    @prop({ required: true })
    canKickBan: boolean = false;

    @prop({ required: true })
    canManageMods: boolean = false;
}

class JudicialPermissions extends PoliticalPermissions {
    type = PoliticalBranchType.Judicial;

    // Within Court
    @prop({ required: true })
    canJury: boolean = false; // Can be selected as a juror

    @prop({ required: true })
    canVerdict: boolean = false; // Create verdicts, accept or deny case requests

    // Appointments
    @prop({ required: true })
    canAppointJudge: boolean = false;

    @prop({ required: true })
    canNominateJudge: boolean = false;

    @prop({ required: true })
    canElectJudge: boolean = false;
}

const PoliticalPermissionsModel = getModelForClass(PoliticalPermissions);

// function defaultPoliticalPermissionCreationTriage(...)

function deletePoliticalPermissionsDocument(_id: string) {
    PoliticalPermissionsModel.deleteOne({ _id });
}

export default PoliticalPermissions;
export { PoliticalPermissionsModel, LegislativePermissions, ExecutivePermissions, JudicialPermissions };
export { deletePoliticalPermissionsDocument };