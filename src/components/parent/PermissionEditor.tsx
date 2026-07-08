import React from 'react';
import type { ParentPermissions } from '../../types';
import { DEFAULT_PARENT_PERMISSIONS } from '../../types';
import { Button } from '../ui';

interface PermissionEditorProps {
  value: ParentPermissions;
  onChange: (next: ParentPermissions) => void;
}

const GROUPS: { label: string; perms: { key: keyof ParentPermissions; label: string; sensitive?: boolean }[] }[] = [
  {
    label: 'Viewing',
    perms: [
      { key: 'viewPoints',             label: 'View Hero Points' },
      { key: 'viewLevel',              label: 'View Hero Level' },
      { key: 'viewBadges',             label: 'View Hero Badges' },
      { key: 'viewAnimals',            label: 'View Hero Companions / Animals' },
      { key: 'viewApprovedActivities', label: 'View Approved Activities' },
      { key: 'viewPendingActivities',  label: 'View Pending Activities' },
      { key: 'viewDeniedActivities',   label: 'View Denied Activities' },
      { key: 'viewProofImages',        label: 'View Uploaded Proof Images', sensitive: true },
    ],
  },
  {
    label: 'Rewards',
    perms: [
      { key: 'viewRewardRequests',    label: 'View Reward Requests' },
      { key: 'approveRewardRequests', label: 'Approve Reward Requests' },
      { key: 'denyRewardRequests',    label: 'Deny Reward Requests' },
      { key: 'addParentNote',         label: 'Add Note to Reward Decision' },
      { key: 'viewRewardHistory',     label: 'View Reward History' },
      { key: 'createCustomRewards',   label: 'Create Custom Rewards for Child' },
    ],
  },
  {
    label: 'Email Notifications',
    perms: [
      { key: 'receiveEmailMilestone', label: 'Email: Child Earns Major Points' },
      { key: 'receiveEmailLevel',     label: 'Email: Child Reaches New Level' },
      { key: 'receiveEmailBadge',     label: 'Email: Child Earns a Badge' },
      { key: 'receiveEmailAnimal',    label: 'Email: Child Unlocks an Animal' },
      { key: 'receiveEmailReward',    label: 'Email: Child Requests a Reward' },
      { key: 'receiveEmailPenalty',   label: 'Email: Cheating Penalty Applied' },
    ],
  },
];

export function PermissionEditor({ value, onChange }: PermissionEditorProps) {
  const toggle = (key: keyof ParentPermissions) => {
    onChange({ ...value, [key]: !value[key] });
  };

  return (
    <div className="space-y-5">
      {GROUPS.map(group => (
        <div key={group.label}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{group.label}</p>
          <div className="space-y-2">
            {group.perms.map(({ key, label, sensitive }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={value[key]}
                  onChange={() => toggle(key)}
                  className="w-4 h-4 rounded accent-purple-600"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900 flex items-center gap-2">
                  {label}
                  {sensitive && (
                    <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">Sensitive</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="pt-2 border-t border-gray-100">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onChange({ ...DEFAULT_PARENT_PERMISSIONS })}
        >
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}
