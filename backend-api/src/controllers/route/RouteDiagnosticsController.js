const db = require('../../config/db');

const RouteDiagnosticsController = {
  /**
   * GET /routes/diagnostics/tickets-progress-layout
   * Finds tickets with TK - ON PROGRESS or TK - (ON) LAYOUT comments that are not eligible for
   * SPOTTER/CONCRETE/ASPHALT and reports reasons per route type.
   */
  async getProgressLayoutDiagnostics(req, res) {
    try {
      const result = await db.query(`
        WITH base AS (
          SELECT 
            t.ticketId,
            t.ticketCode,
            t.comment7d,
            t.incidentId,
            cu.name AS contract_unit_name
          FROM Tickets t
          LEFT JOIN ContractUnits cu ON cu.contractUnitId = t.contractUnitId AND cu.deletedAt IS NULL
          WHERE t.deletedAt IS NULL
            AND (
              t.comment7d ILIKE '%TK - ON PROGRESS%'
              OR t.comment7d ILIKE '%TK- ON PROGRESS%'
              OR t.comment7d ILIKE '%TK - ON LAYOUT%'
              OR t.comment7d ILIKE '%TK- ON LAYOUT%'
              OR t.comment7d ILIKE '%TK - LAYOUT%'
              OR t.comment7d ILIKE '%TK- LAYOUT%'
              OR t.comment7d ILIKE '%TK - LAY OUT%'
            )
            AND NOT (
              COALESCE(t.ticketType,'') ILIKE '%mobilization%'
              OR COALESCE(cu.name,'') ILIKE '%mobilization%'
              OR COALESCE(cu.name,'') ILIKE '%mob%'
            )
        ),
        incident_name AS (
          SELECT b.ticketId, i.name AS incident_name
          FROM base b
          LEFT JOIN IncidentsMx i ON i.incidentId = b.incidentId AND i.deletedAt IS NULL
        ),
        perm AS (
          SELECT pt.ticketId, MAX(p.expireDate) AS permit_expire_date
          FROM PermitedTickets pt
          JOIN Permits p ON p.PermitId = pt.permitId AND p.deletedAt IS NULL
          WHERE pt.deletedAt IS NULL
          GROUP BY pt.ticketId
        ),
        phases AS (
          SELECT 
            b.ticketId,
            MAX(CASE WHEN s.name = 'Spotting' THEN ts.endingdate END) AS spotting_end,
            -- Concrete (Pour)
            (COUNT(*) FILTER (WHERE s.name = 'Pour')) > 0 AS has_pour_phase,
            MAX(CASE WHEN s.name = 'Pour' THEN ts.endingdate END) AS pour_end,
            -- Asphalt group
            (COUNT(*) FILTER (WHERE s.name IN ('Grind','Asphalt','Crack Seal'))) > 0 AS has_asphalt_phase,
            COALESCE(MAX(CASE WHEN s.name IN ('Grind','Asphalt','Crack Seal') AND ts.endingdate IS NULL THEN 1 ELSE 0 END),0) AS asphalt_any_incomplete
          FROM base b
          JOIN TicketStatus ts ON ts.ticketId = b.ticketId AND ts.deletedAt IS NULL
          JOIN TaskStatus s ON s.taskStatusId = ts.taskStatusId AND s.deletedAt IS NULL
          GROUP BY b.ticketId
        )
        SELECT 
          b.ticketId,
          b.ticketCode,
          b.comment7d,
          b.contract_unit_name,
          COALESCE(perm.permit_expire_date, NULL) AS permit_expire_date,
          -- aggregated phase info
          p.spotting_end,
          (p.spotting_end IS NOT NULL) AS spotting_completed,
          p.has_pour_phase,
          p.pour_end,
          p.has_asphalt_phase,
          (p.asphalt_any_incomplete = 1) AS asphalt_incomplete,
          -- asphalt all completed if Crack Seal completed
          EXISTS (
            SELECT 1
            FROM TicketStatus tks11
            JOIN TaskStatus ts11 ON tks11.taskStatusId = ts11.taskStatusId
            WHERE tks11.ticketId = b.ticketId
              AND ts11.name = 'Crack Seal'
              AND tks11.endingdate IS NOT NULL
              AND tks11.deletedAt IS NULL
              AND ts11.deletedAt IS NULL
          ) AS asphalt_all_completed,
          -- comments inclusion/exclusion
          (
            b.comment7d ILIKE '%TK - ON PROGRESS%'
            OR b.comment7d ILIKE '%TK- ON PROGRESS%'
            OR b.comment7d ILIKE '%TK - ON LAYOUT%'
            OR b.comment7d ILIKE '%TK- ON LAYOUT%'
            OR b.comment7d ILIKE '%TK - LAYOUT%'
            OR b.comment7d ILIKE '%TK- LAYOUT%'
            OR b.comment7d ILIKE '%TK - LAY OUT%'
          ) AS comment_ok_asphalt,
          (
            b.comment7d IS NULL
            OR b.comment7d = ''
            OR b.comment7d ILIKE '%TK - PERMIT EXTENDED%'
            OR b.comment7d ILIKE '%TK - LAYOUT%'
            OR b.comment7d ILIKE '%TK- LAYOUT%'
            OR b.comment7d ILIKE '%TK - LAY OUT%'
          ) AS comment_ok_spotting,
          (
            b.comment7d IS NULL
            OR b.comment7d = ''
            OR b.comment7d ILIKE '%TK - PERMIT EXTENDED%'
            OR b.comment7d ILIKE '%TK - LAYOUT%'
            OR b.comment7d ILIKE '%TK- LAYOUT%'
            OR b.comment7d ILIKE '%TK - LAY OUT%'
            OR b.comment7d ILIKE '%TK - ON PROGRESS%'
            OR b.comment7d ILIKE '%TK- ON PROGRESS%'
          ) AS comment_ok_concrete,
          (
            COALESCE(b.comment7d,'') ILIKE '%TK - CANCELLED%'
            OR COALESCE(b.comment7d,'') ILIKE '%TK - HOLD OFF%'
            OR COALESCE(b.comment7d,'') ILIKE '%TK- ON HOLD OFF%'
            OR COALESCE(b.comment7d,'') ILIKE '%TK - ON HOLD OFF%'
            OR COALESCE(b.comment7d,'') ILIKE '%TK - COMPLETED%'
            OR COALESCE(b.comment7d,'') ILIKE '%TK - COMPLETE%'
            OR COALESCE(b.comment7d,'') ILIKE '%COMPLETED%'
            OR COALESCE(b.comment7d,'') ILIKE '%COMPLETE%'
            OR COALESCE(b.comment7d,'') ILIKE '%TK - EXPIRED%'
            OR COALESCE(b.comment7d,'') ILIKE '%TK - NEEDS PERMIT EXTENSION%'
          ) AS comment_excluded,
          -- asphalt conflict: any POUR incomplete on same incident NAME
          EXISTS (
            SELECT 1
            FROM Tickets t2
            JOIN TicketStatus tks2 ON t2.ticketId = tks2.ticketId
            JOIN TaskStatus ts2 ON ts2.taskStatusId = tks2.taskStatusId
            JOIN IncidentsMx i2 ON i2.incidentId = t2.incidentId AND i2.deletedAt IS NULL
            JOIN incident_name inx ON inx.incident_name = i2.name
            WHERE t2.deletedAt IS NULL
              AND ts2.name = 'Pour'
              AND tks2.endingdate IS NULL
              AND tks2.deletedAt IS NULL
              AND ts2.deletedAt IS NULL
          ) AS concrete_pour_incomplete_same_incident_name,
          ARRAY(
            SELECT DISTINCT t2.ticketcode
            FROM Tickets t2
            JOIN TicketStatus tks2 ON t2.ticketId = tks2.ticketId
            JOIN TaskStatus ts2 ON ts2.taskStatusId = tks2.taskStatusId
            JOIN IncidentsMx i2 ON i2.incidentId = t2.incidentId AND i2.deletedAt IS NULL
            JOIN incident_name inx2 ON inx2.incident_name = i2.name
            WHERE t2.deletedAt IS NULL
              AND ts2.name = 'Pour'
              AND tks2.endingdate IS NULL
              AND tks2.deletedAt IS NULL
              AND ts2.deletedAt IS NULL
            ORDER BY t2.ticketcode
          ) AS offending_tickets,
          -- already assigned on any active route
          EXISTS (
            SELECT 1 FROM RouteTickets rt
            JOIN Routes r ON r.routeId = rt.routeId
            WHERE rt.ticketId = b.ticketId
              AND r.deletedAt IS NULL
              AND rt.deletedAt IS NULL
          ) AS in_active_route,
          -- permit soon expiring
          EXISTS (
            SELECT 1 FROM PermitedTickets pt
            JOIN Permits p ON p.PermitId = pt.permitId
            WHERE pt.ticketId = b.ticketId
              AND pt.deletedAt IS NULL AND p.deletedAt IS NULL
              AND p.expireDate IS NOT NULL AND p.expireDate > CURRENT_DATE
              AND (p.expireDate::date - CURRENT_DATE::date) < 4
          ) AS permit_expiring_soon
        FROM base b
        LEFT JOIN phases p ON p.ticketId = b.ticketId
        LEFT JOIN incident_name inx ON inx.ticketId = b.ticketId
        LEFT JOIN perm ON perm.ticketId = b.ticketId
        ORDER BY b.ticketId ASC
      `);

      const ticketsAll = result.rows.map(row => {
        // Stage 1: Spotting (relevant when no endingdate)
        const spottingRelevant = !row.spotting_end;
        const eligibleSpotting = spottingRelevant && row.comment_ok_spotting && !row.comment_excluded && !row.permit_expiring_soon;

        // Stage 2/3 only if spotting completed
        const proceedToNext = !spottingRelevant && !!row.spotting_completed;

        // Determine relevance
        const concreteRelevant = proceedToNext && !!row.has_pour_phase && !row.pour_end;
        const asphaltRelevant = proceedToNext && !!row.has_asphalt_phase && !!row.asphalt_incomplete;

        const eligibleConcrete = concreteRelevant
          && row.comment_ok_concrete
          && !row.comment_excluded
          && !row.permit_expiring_soon;

        const eligibleAsphalt = asphaltRelevant
          && row.comment_ok_asphalt
          && !row.concrete_pour_incomplete_same_incident_name
          && !row.permit_expiring_soon
          && !row.comment_excluded;

        // Build reasons only for relevant checks and only when not eligible
        const reasons = {};

        // Only one failing type should be reported, in priority order: SPOTTER -> CONCRETE -> ASPHALT
        let ineligibleType = null;
        if (spottingRelevant && !eligibleSpotting) {
          const r = [];
          if (!row.comment_ok_spotting) r.push('invalid_comment_for_spotting');
          if (row.comment_excluded) r.push('excluded_by_comment');
          if (row.permit_expiring_soon) r.push('permit_expiring_soon');
          // spotting_incomplete is true by relevance
          reasons.spotting = r;
          ineligibleType = 'SPOTTER';
        } else if (proceedToNext) {
          if (!ineligibleType && concreteRelevant && !eligibleConcrete) {
            const r = [];
            r.push('pour_incomplete');
            if (!row.comment_ok_concrete) r.push('invalid_comment_for_concrete');
            if (row.comment_excluded) r.push('excluded_by_comment');
            if (row.permit_expiring_soon) r.push('permit_expiring_soon');
            reasons.concrete = r;
            ineligibleType = 'CONCRETE';
          }
          if (!ineligibleType && asphaltRelevant && !eligibleAsphalt) {
            const r = [];
            if (!row.comment_ok_asphalt) r.push('invalid_comment_for_asphalt');
            if (row.concrete_pour_incomplete_same_incident_name) r.push('pour_incomplete_in_same_incident_name');
            if (row.comment_excluded) r.push('excluded_by_comment');
            if (row.permit_expiring_soon) r.push('permit_expiring_soon');
            if (row.offending_tickets && row.offending_tickets.length > 0) {
              r.push(`offending_tickets:${row.offending_tickets.join(',')}`);
            }
            reasons.asphalt = r;
            ineligibleType = 'ASPHALT';
          }
          // If asphalt is not relevant but we are past spotting, provide reasons why
          if (!ineligibleType && !asphaltRelevant) {
            const r = [];
            if (!row.has_asphalt_phase) r.push('no_asphalt_phase');
            if (row.has_asphalt_phase && !row.asphalt_incomplete) {
              if (row.asphalt_all_completed) {
                r.push('asphalt_all_completed');
              } else {
                r.push('no_incomplete_asphalt_phase');
              }
            }
            if (r.length > 0) {
              reasons.asphalt = r;
              ineligibleType = 'ASPHALT';
            }
          }
        }

        // Exclude tickets already in any active route
        if (row.in_active_route) {
          return {
            _include: false
          };
        }

        // Decide inclusion: return only first failing relevant stage
        const includeTicket = (
          (!!ineligibleType)
        );

        return {
          ticketId: row.ticketid,
          ticketCode: row.ticketcode,
          comment7d: row.comment7d,
          contractUnitName: row.contract_unit_name,
          permitExpireDate: row.permit_expire_date,
          ineligibleType,
          reasons,
          _include: includeTicket
        };
      });

      // Only return tickets that are excluded from all three types (already eligible tickets are on other endpoints)
      const tickets = ticketsAll.filter(t => t._include).map(t => ({
        ticketId: t.ticketId,
        ticketCode: t.ticketCode,
        comment7d: t.comment7d,
        contractUnitName: t.contractUnitName,
        permitExpireDate: t.permitExpireDate,
        ineligibleType: t.ineligibleType,
        reasons: t.reasons
      }));

      res.status(200).json({
        message: 'Diagnostics (excluded) for tickets with progress/layout comments',
        count: tickets.length,
        tickets
      });
    } catch (error) {
      console.error('Error in getProgressLayoutDiagnostics:', error);
      res.status(500).json({ 
        error: 'Failed to compute diagnostics', 
        details: error.message 
      });
    }
  }
};

module.exports = RouteDiagnosticsController;



