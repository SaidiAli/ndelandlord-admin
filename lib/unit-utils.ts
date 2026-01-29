import {
  ResidentialUnitDetails,
  CommercialUnitDetails,
  PropertyType,
  residentialUnitTypes,
  commercialUnitTypes,
} from '@/types';

/**
 * Type guard to check if unit details are residential
 */
export function isResidentialDetails(
  details: ResidentialUnitDetails | CommercialUnitDetails | undefined
): details is ResidentialUnitDetails {
  if (!details) return false;
  return 'bedrooms' in details && 'bathrooms' in details;
}

/**
 * Type guard to check if unit details are commercial
 */
export function isCommercialDetails(
  details: ResidentialUnitDetails | CommercialUnitDetails | undefined
): details is CommercialUnitDetails {
  if (!details) return false;
  return !('bedrooms' in details) && !('bathrooms' in details);
}

/**
 * Get a human-readable summary of unit details
 */
export function getUnitDisplaySummary(
  details: ResidentialUnitDetails | CommercialUnitDetails | undefined,
  propertyType?: PropertyType
): string {
  if (!details) {
    return propertyType === 'commercial' ? 'Commercial Unit' : 'Residential Unit';
  }

  if (isResidentialDetails(details)) {
    return `${details.bedrooms} bed / ${details.bathrooms} bath`;
  }

  if (isCommercialDetails(details)) {
    return capitalize(details.unitType.replace('_', ' '));
  }

  return 'Unit';
}

/**
 * Capitalize first letter and format enum values for display
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get display label for residential unit type
 */
export function getResidentialUnitTypeLabel(type: string): string {
  return capitalize(type);
}

/**
 * Get display label for commercial unit type
 */
export function getCommercialUnitTypeLabel(type: string): string {
  return capitalize(type);
}

/**
 * Get all residential unit type options for select dropdowns
 */
export function getResidentialUnitTypeOptions() {
  return residentialUnitTypes.map(type => ({
    value: type,
    label: capitalize(type),
  }));
}

/**
 * Get all commercial unit type options for select dropdowns
 */
export function getCommercialUnitTypeOptions() {
  return commercialUnitTypes.map(type => ({
    value: type,
    label: capitalize(type),
  }));
}

/**
 * Format property type for display
 */
export function formatPropertyType(type: PropertyType): string {
  return capitalize(type);
}

/**
 * Get additional details summary for residential units
 */
export function getResidentialDetailsSummary(details: ResidentialUnitDetails): string[] {
  const summary: string[] = [];

  if (details.isFurnished) {
    summary.push('Furnished');
  }

  if (details.hasBalcony) {
    summary.push('Balcony');
  }

  if (details.floorNumber !== undefined && details.floorNumber !== null) {
    summary.push(`Floor ${details.floorNumber}`);
  }

  return summary;
}

/**
 * Get additional details summary for commercial units
 */
export function getCommercialDetailsSummary(details: CommercialUnitDetails): string[] {
  const summary: string[] = [];

  if (details.suiteNumber) {
    summary.push(`Suite ${details.suiteNumber}`);
  }

  if (details.floorNumber !== undefined && details.floorNumber !== null) {
    summary.push(`Floor ${details.floorNumber}`);
  }

  if (details.maxOccupancy) {
    summary.push(`Max ${details.maxOccupancy} occupants`);
  }

  if (details.ceilingHeight) {
    summary.push(`${details.ceilingHeight}ft ceiling`);
  }

  return summary;
}
