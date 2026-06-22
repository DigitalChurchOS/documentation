  /**
   * Preview a theme config in temporary simulation staging context.
   */
  static async previewTheme(tenantId: string, themeId: string) {
    // Fetch theme
    const theme = await prisma.theme.findFirst({
      where: {
        id: themeId,
        OR: [{ tenantId: null }, { tenantId }],
      },
    });

    if (!theme) {
      throw new Error('Theme not found');
    }

    const settings = safeParseJson<Record<string, any>>(theme.draftSettings || theme.settings, {});

    return {
      themeId: theme.id,
      name: theme.name,
      settings,
      version: settings.marketplace?.version || 'local',
      isPreview: true,
      timestamp: new Date().toISOString(),
    };
  }