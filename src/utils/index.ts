export function createPageUrl(pageName: string) {
    return '/crm/' + pageName.toLowerCase().replace(/ /g, '-');
}
