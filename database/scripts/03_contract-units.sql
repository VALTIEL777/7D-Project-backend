-- 1. ADA - SINGLE
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('69009869', 'ADA - SINGLE', 'Each', 
'All labor, equipment and materials required to reconstruct/construct single ADA corners, including traffic control, grading, base materials, forming, concrete work, tactile tile installation, backfilling, protection, and documentation.',
'Restoration beyond original paving scope, landscaping materials and plantings.',
'Paid at contract unit price per each single ADA corner.',
5500.00);

-- 2. ADA - DOUBLE
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('69009870', 'ADA - DOUBLE', 'Each', 
'All labor, equipment and materials required to reconstruct/construct double ADA corners, including traffic control, grading, base materials, forming, concrete work, tactile tile installation, backfilling, protection, and documentation.',
'Restoration beyond original paving scope, landscaping materials and plantings.',
'Paid at contract unit price per each double ADA corner.',
9000.00);

-- 3. ADA – RAMP REPAIR ONLY
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('69010003', 'ADA – RAMP ONLY incl. ADA Tactile', 'Square Foot', 
'All labor, equipment and materials required to remove and replace components of an ADA Ramp including keystone, concrete ramp panels, integrated ramp curbs, and tactile panels.',
'Restoration adjacent to ADA ramp, curb & gutter, winter protection, asphalt paving.',
'Paid per square foot measured from outside edge of Keystone to curb joint and widest width.',
500.00);

-- 4. HANDICAP PANELS
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('800413', 'HANDICAP PANELS', 'Each', 
'All labor, equipment and materials required to install new tactile tiles including traffic control, grading, installation, and protection.',
'Concrete panels, integrated curbs, winter protection.',
'Paid per each panel replaced as determined by contractor per CDOT standards.',
300.00);

-- 5. ALLEY APRONS – LUMP SUM
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('69010808', 'REST_OM_ALLEY_APRON', 'Each', 
'All labor, equipment and materials required to install concrete aprons including traffic control, removal, grading, forming, concrete work, and protection.',
'Restoration beyond original scope, special appurtenances replacement.',
'Paid per each apron unit with typical thickness variation of +/- 1".',
10000.00);

-- 6. Asphalt Paving (N30_N50_NOTHERMO)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('800117A', 'REST_OM_ASPH_N30_N50_NOTHERMO', 'Square Feet', 
'All labor, equipment and materials required to remove and resurface asphalt areas including traffic control, milling, joint preparation, asphalt placement, striping, and testing.',
'Restoration beyond original scope, concrete base, speed bumps, special striping.',
'Paid per square foot rounded to nearest whole square foot.',
7.50);

-- 7. Asphalt Paving (N70_NOTHERMO)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('800117B', 'REST_OM_ASPH_N70_NOTHERMO', 'Square Feet', 
'All labor, equipment and materials required to remove and resurface asphalt areas including traffic control, milling, joint preparation, asphalt placement, striping, and testing.',
'Restoration beyond original scope, concrete base, speed bumps, special striping.',
'Paid per square foot rounded to nearest whole square foot.',
7.50);

-- 8. Asphalt Paving (N90_NOTHERMO)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('800117C', 'REST_OM_ASPH_N90_NOTHERMO', 'Square Feet', 
'All labor, equipment and materials required to remove and resurface asphalt areas including traffic control, milling, joint preparation, asphalt placement, striping, and testing.',
'Restoration beyond original scope, concrete base, speed bumps, special striping.',
'Paid per square foot rounded to nearest whole square foot.',
7.50);

-- 9. Asphalt Skid Resistant Paving
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('800229', 'REST_OM_ASPH_SKID_RESIST', 'Square Feet', 
'All labor, equipment and materials required to remove and resurface with skid-resistant asphalt including traffic control, joint preparation, and striping.',
'Restoration beyond original scope, concrete base, speed bumps, symbols.',
'Paid per square foot rounded to nearest whole square foot.',
9.00);

-- 10. BOLLARD
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('69008204', 'BOLLARD', 'Each', 
'All labor, equipment and materials required to install a bollard including coring, pipe installation, concrete/grout, and cover installation.',
'Restoration associated with gas facility installation.',
'Paid per each bollard with prior Company request.');

-- 11. BUS PAD
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('69010809', 'REST_OM_BUS_PAD', 'Square Feet', 
'All labor, equipment and materials required to restore bus pad sections including traffic control, grading, forming, concrete work, and protection.',
'Restoration beyond original paving scope.',
'Paid per square foot for complete panels based on existing joints.',
22.25);

-- 12. SPEED BUMP (FULL)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('69012176', 'SPEED BUMP (FULL)', 'Each', 
'All labor, equipment and materials required to replace a Speed Bump including traffic control, grading, removal, and installation.',
'Restoration beyond original paving scope.',
'Paid per each complete speed hump replacement.',
4200.00);

-- 13. Carriage Walk
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('800134', 'REST_OM_CARRIAGE', 'Square Feet', 
'All labor, equipment and materials required to install carriage walk including traffic control, grading, forming, concrete work, and protection.',
'Restoration beyond original scope.',
'Paid per square foot with typical thickness variation of +/- 1".');

-- 14. Catwalk
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('800410', 'REST_OM_CATWALK', 'Square Feet', 
'All labor, equipment and materials required to install catwalk including traffic control, grading, forming, concrete work, and protection.',
'Restoration beyond original scope.',
'Paid per square foot with typical thickness variation of +/- 1".');

-- 15. T-Cut Pavement
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('8001119', 'REST_OM_TCUT_NOTHERMO', 'Square Feet', 
'All labor, equipment and materials required to provide concrete restoration of T-Cut including traffic control, grading, forming, and concrete work.',
'Curb & gutter installation, thermo-striping, restoration beyond original scope.',
'Paid per square foot of concrete base to grade.');

-- 16. CONCRETE BASE TO GRADE (8BASE)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('69012170', 'REST_OM_CONC_8BASE', 'Square Feet', 
'All labor, equipment and materials required to provide concrete base to grade including traffic control, grading, compaction, forming, and concrete work.',
'Curb & gutter installation, restoration beyond original scope.',
'Paid per square foot of concrete base to grade.',
12.35);

-- 17. CONCRETE BASE TO GRADE (10BASE)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('800125', 'REST_OM_CONC_10BASE', 'Square Feet', 
'All labor, equipment and materials required to provide concrete base to grade including traffic control, grading, compaction, forming, and concrete work.',
'Curb & gutter installation, restoration beyond original scope.',
'Paid per square foot of concrete base to grade.',
15.43);

-- 18. CONCRETE BASE TO GRADE (12BASE)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('800340', 'REST_OM_CONC_12BASE', 'Square Feet', 
'All labor, equipment and materials required to provide concrete base to grade including traffic control, grading, compaction, forming, and concrete work.',
'Curb & gutter installation, restoration beyond original scope.',
'Paid per square foot of concrete base to grade.',
18.52);

-- 19. CONCRETE REMOVAL ONLY
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('69005922', 'Concrete Removal Only', 'Square Feet', 
'All labor, equipment and materials required to remove concrete only including traffic control and saw-cutting.',
'Restoration beyond removal scope.',
'Paid per square foot of concrete removed.',
9.00);

-- 20. ASPHALT REMOVAL ONLY
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('69005920', 'Asphalt Removal Only', 'Square Feet', 
'All labor, equipment and materials required to remove asphalt only including traffic control and saw-cutting.',
'Restoration beyond removal scope.',
'Paid per square foot of asphalt removed.',
6.00);

-- 21. CURB & GUTTER (HAND)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('800411A', 'REST_OM_CURB_AND_GUTTER_HAND', 'Lineal Feet', 
'All labor, equipment and materials required to install curb or combination curb and gutter including traffic control, grading, forming, and concrete work.',
'Restoration beyond original scope required.',
'Paid per lineal foot of same type/size/configuration as existing.',
100.00);

-- 22. CURB
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('800135', 'REST_OM_CURB', 'Lineal Feet', 
'All labor, equipment and materials required to install curb including traffic control, grading, forming, and concrete work.',
'Restoration beyond original scope required.',
'Paid per lineal foot of same type/size/configuration as existing.',
80.00);


-- 23. DRIVEWAY (8GRADE)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('800133', 'REST_OM_DRIVE', 'Square Feet', 
'All labor, equipment and materials required to install concrete driveway including traffic control, removal, grading, forming, and concrete work.',
'Restoration beyond original scope.',
'Paid per square foot with typical thickness variation of +/- 1".');

-- 24. DRIVEWAY (10GRADE)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('8004009', 'REST_OM_10GRADE_DRIVE', 'Square Feet', 
'All labor, equipment and materials required to install concrete driveway including traffic control, removal, grading, forming, and concrete work.',
'Restoration beyond original scope.',
'Paid per square foot with typical thickness variation of +/- 1".');

-- 25. FINISHED CONCRETE PAVEMENT (8FIN)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('800128', 'REST_OM_CONC_8FIN', 'Square Feet', 
'All labor, equipment and materials required to place and finish concrete pavement including traffic control, removal, grading, forming, and finishing.',
'Curb & gutter installation, restoration beyond original scope.',
'Paid per square foot for full lane widths and complete panels.',
12.75);

-- 26. FINISHED CONCRETE PAVEMENT (10FIN)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('800127', 'REST_OM_CONC_10FIN', 'Square Feet', 
'All labor, equipment and materials required to place and finish concrete pavement including traffic control, removal, grading, forming, and finishing.',
'Curb & gutter installation, restoration beyond original scope.',
'Paid per square foot for full lane widths and complete panels.',
16.00);

-- 27. FINISHED CONCRETE PAVEMENT (12FIN)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('800392', 'REST_OM_CONC_12FIN', 'Square Feet', 
'All labor, equipment and materials required to place and finish concrete pavement including traffic control, removal, grading, forming, and finishing.',
'Curb & gutter installation, restoration beyond original scope.',
'Paid per square foot for full lane widths and complete panels.',
19.00);

-- 28. CONCRETE SIDEWALK/FLATWORK (PUBLIC)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('800132', 'REST_OM_SDWLK_PUBLIC', 'Square Feet', 
'All labor, equipment and materials required to install concrete sidewalk/flatwork including traffic control, grading, forming, and concrete work.',
'Restoration beyond original scope, special appurtenances.',
'Paid per square foot with typical thickness variation of +/- 1".');

-- 29. CONCRETE SIDEWALK/FLATWORK (INSIDE)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('800139', 'REST_OM_SDWLK_INSIDE', 'Square Feet', 
'All labor, equipment and materials required to install concrete sidewalk/flatwork including traffic control, grading, forming, and concrete work.',
'Restoration beyond original scope, special appurtenances.',
'Paid per square foot with typical thickness variation of +/- 1".');

-- 30. CONCRETE SIDEWALK/FLATWORK (GRADE)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('800412', 'REST_OM_GRADE_SDWLK', 'Square Feet', 
'All labor, equipment and materials required to install concrete sidewalk/flatwork including traffic control, grading, forming, and concrete work.',
'Restoration beyond original scope, special appurtenances.',
'Paid per square foot with typical thickness variation of +/- 1".');

-- 31. Street Furniture Replacement
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('69012173', 'Street Furniture_Replacement', 'EA', 
'All labor, equipment and materials required to replace signage and/or street furniture including traffic control, forming, and concrete work.',
'Restoration beyond original scope.',
'Paid per each item replaced in public right of way.',
4000.00);

-- 32. Signs
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('800180', 'REST_OM_SIGNS', 'EA', 
'All labor, equipment and materials required to replace signage including traffic control, forming, and concrete work.',
'Restoration beyond original scope.',
'Paid per each sign replaced in public right of way.',
500.00);

-- 33. STAMPED CONCRETE
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('69010803', 'REST_OM_CONC_STAMP', 'Square Feet', 
'All labor, equipment and materials required to emboss concrete surface with pattern to match existing.',
'Labor/materials for concrete paving construction.',
'Paid per square foot as adder to concrete units.',
40.00);

-- 34. STAMPED ASPHALT
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('69010019', 'Stamped Asphalt', 'Square Feet', 
'All labor, equipment and materials required to emboss asphalt surface with pattern to match existing including micro-milling and striping.',
'Labor/materials for asphalt paving construction.',
'Paid per square foot where existing was textured/colored.',
100.00);

-- 35. THERMOPLASTIC (UPTO 4IN)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('69012171', 'REST_OM_UPTO_4IN_THERMO', 'Linear Feet', 
'All labor, equipment and materials required to apply striping up to 4 inches wide to match existing including traffic control and protection.',
'Labor/materials for asphalt paving construction.',
'Paid per linear foot with Restoration Department approval.',
6.00);

-- 36. THERMOPLASTIC (LARGER 4IN)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('69012172', 'REST_OM_LARGER_4IN_THERMO', 'Linear Feet', 
'All labor, equipment and materials required to apply striping larger than 4 inches wide to match existing including traffic control and protection.',
'Labor/materials for asphalt paving construction.',
'Paid per linear foot with Restoration Department approval.',
15.00);

-- 37. Thermoplastic Symbol
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('800466', 'Thermoplastic Symbol', 'Each', 
'All labor, equipment and materials required to apply symbols to match existing including traffic control and protection.',
'Labor/materials for asphalt paving construction.',
'Paid per each symbol with Restoration Department approval.',
850.00);

-- 38. TOPSOIL
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('69010807', 'REST_OM_TOPSOIL', 'Square Feet', 
'All labor, equipment and materials required to install topsoil including removal, transportation, installation, and watering.',
'Costs for replacement due to property owner lack of maintenance.',
'Paid per square foot as specified.');

-- 39. RESOD
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('69012184', 'REST_OM_RESOD', 'Square Feet', 
'All labor, equipment and materials required to install sod including removal, transportation, installation, and watering.',
'Costs for replacement due to property owner lack of maintenance.',
'Paid per square foot as specified.');

-- 40. SEED PELLETS
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('800400', 'REST_OM_SEED_PELLETS', 'Square Feet', 
'All labor, equipment and materials required to install seed pellets including removal, transportation, installation, and watering.',
'Costs for replacement due to property owner lack of maintenance.',
'Paid per square foot as specified.');

-- 41. SEED EROSION
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('800350', 'REST_OM_SEED_EROSION', 'Square Feet', 
'All labor, equipment and materials required to install erosion seed including removal, transportation, installation, and watering.',
'Costs for replacement due to property owner lack of maintenance.',
'Paid per square foot as specified.');

-- 42. SEED RAKING
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('800148', 'REST_OM_RAKING', 'Square Feet', 
'All labor, equipment and materials required to install seed with raking including removal, transportation, installation, and watering.',
'Costs for replacement due to property owner lack of maintenance.',
'Paid per square foot as specified.');

-- 43. REWORK SOD
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('69102180', 'REST_OM_REWORK_SOD', 'Square Feet', 
'All labor, equipment and materials required to rework sod that was properly installed but not maintained by property owner.',
'Initial installation costs.',
'Paid per square foot as directed by PGL Restoration Supervisor.');

-- 44. REWORK SEED
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('69012187', 'REST_OM_REWORK_SEED', 'Square Feet', 
'All labor, equipment and materials required to rework seed that was properly installed but not maintained by property owner.',
'Initial installation costs.',
'Paid per square foot as directed by PGL Restoration Supervisor.');

-- 45. PLANTINGS
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('69012177', 'PLANTINGS', 'Each', 
'All labor, equipment and materials required to install plantings including excavation, preparation, and installation.',
'Topsoil, mulch or decorative stone, specialty plantings.',
'Paid per each for standard plantings.');

-- 46. DECIDUOUS SHRUBS
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('69009868', 'DECIDUOUS SHRUBS', 'Each', 
'All labor, equipment and materials required to install deciduous shrubs including excavation, preparation, and installation.',
'Topsoil, mulch or decorative stone, specialty plantings.',
'Paid per each for standard shrubs (Rose Bush, Rose of Sharon, or Spirea, minimum 3 gallons).');

-- 47. EVERGREEN
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('NEW CU', 'EVERGREEN', 'Each', 
'All labor, equipment and materials required to install evergreens including excavation, preparation, and installation.',
'Topsoil, mulch or decorative stone, specialty plantings.',
'Paid per each for standard evergreens (minimum 3 feet tall).');

-- 48. TREES
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('69012178', 'TREES', 'Quote', 
'All labor, equipment and materials required to install trees including excavation, preparation, and installation.',
'Topsoil, mulch or decorative stone, specialty plantings.',
'Paid per quoted price per each tree with Restoration Supervisor pre-approval.');

-- 49. TIMBERS (35X35)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('800154', 'REST_OM_TIMBERS_35X35', 'Linear Feet', 
'All labor, equipment and materials required to replace existing 3.5"x3.5" Timbers disturbed by construction operations.',
'Vegetation installation, backfill.',
'Paid per linear foot rounded to nearest whole foot.');

-- 50. TIMBERS (4X6)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('800155', 'REST_OM_TIMBERS_4X6', 'Linear Feet', 
'All labor, equipment and materials required to replace existing 4"x6" Timbers disturbed by construction operations.',
'Vegetation installation, backfill.',
'Paid per linear foot rounded to nearest whole foot.');

-- 51. TIMBERS (6X6)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('800156', 'REST_OM_TIMBERS_6X6', 'Linear Feet', 
'All labor, equipment and materials required to replace existing 6"x6" Timbers disturbed by construction operations.',
'Vegetation installation, backfill.',
'Paid per linear foot rounded to nearest whole foot.');

-- 52. DECORATIVE STONE
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('800157A', 'REST_OM_STONE', 'Cubic Feet', 
'All labor, equipment and materials required to replace decorative stone including removal and placement to match existing.',
'Vegetation installation, specialty stone.',
'Paid per cubic foot rounded to nearest whole cubic foot.');

-- 53. BRICK PAVERS
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('800381', 'REST_OM_BRICKS', 'Square Feet', 
'All labor, equipment and materials required to remove and replace brick pavers including traffic control and reinstallation.',
'Restoration adjacent to pavers, replacement pavers.',
'Paid per square foot for standard paver materials.');

-- 54. LANDSCAPE BARK
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('800160A', 'REST_OM_BARK', 'Cubic Feet', 
'All labor, equipment and materials required to replace landscape bark materials including removal and placement.',
'Vegetation installation.',
'Paid per cubic foot rounded to nearest whole cubic foot.');

-- 55. SPOIL REMOVAL & DISPOSAL
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('800165', 'SPOIL REMOVAL AND DISPOSAL', 'Cubic Feet', 
'All labor, equipment and materials required to remove and dispose of excessive soil including traffic control and transportation.',
'Vegetation installation.',
'Paid per cubic foot with prior approval.');

-- 56. SPRINKLER REPAIR
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('69012179', 'Sprinkler Repair', 'Quote', 
'All labor, equipment and materials required to repair damaged sprinklers including excavation and installation.',
'Plantings, bushes, trees, mulch, decorative stone.',
'Paid per approved quote with Supervisor approval.');

-- 57. VALVE BASINS (Repair)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('Basin Repair', 'VALVE BASINS (Repair)', 'Each', 
'All labor, equipment and materials required to repair valve basins including excavation, precast sections, backfill, and concrete work.',
'Valves or fittings installation.',
'Paid per each of specified type and size.');

-- 58. VALVE BASINS (Re-Build)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('Basin Re-Build', 'VALVE BASINS (Re-Build)', 'Each', 
'All labor, equipment and materials required to re-build valve basins including excavation, precast sections, backfill, and concrete work.',
'Valves or fittings installation.',
'Paid per each of specified type and size.');

-- 59. VALVE BASINS (New)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('New Basin', 'VALVE BASINS (New)', 'Each', 
'All labor, equipment and materials required to install new valve basins including excavation, precast sections, backfill, and concrete work.',
'Valves or fittings installation.',
'Paid per each of specified type and size.');

-- 60. ROADWAY BOX ADJUSTMENTS (Parkway)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('69008178', 'REST_OM_RPR_VBOX_PKWY', 'Each', 
'All labor, equipment and materials required to adjust roadway box in parkway including excavation, backfill, and concrete work.',
'Valves or fittings installation.',
'Paid per each at specified location.');

-- 61. ROADWAY BOX ADJUSTMENTS (Street)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('69008179', 'REST_OM_RPR_VBOX_STR', 'Each', 
'All labor, equipment and materials required to adjust roadway box in street including excavation, backfill, and concrete work.',
'Valves or fittings installation.',
'Paid per each at specified location.');

-- 62. BASIN/ROADWAY BOX REMOVAL (Box)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('69012181', 'REMOVE FACILITY - BOX', 'Each', 
'All labor, equipment and materials required to remove roadway box including excavation and backfill.',
'Valves or fittings removal.',
'Paid per each at specified location.');

-- 63. BASIN/ROADWAY BOX REMOVAL (Basin)
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('69012182', 'REMOVE FACILITY - BASIN', 'Each', 
'All labor, equipment and materials required to remove basin including excavation and backfill.',
'Valves or fittings removal.',
'Paid per each at specified location.');

-- 64. DELINEATOR POST
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('69012174', 'DELINEATOR POST', 'Each', 
'All labor, equipment and materials required to install Post Delineator including excavation and backfill.',
'Thermoplastic striping.',
'Paid per each kind-for-kind replacement.',
250.00);

-- 65. DELINEATOR BARRIER
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('69012175', 'DELINEATOR BARRIER', 'Each', 
'All labor, equipment and materials required to install Barrier Delineator including excavation and backfill.',
'Thermoplastic striping.',
'Paid per each kind-for-kind replacement.',
450.00);

-- 66. INSPECTION FEE
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('800164', 'INSPECTION FEE', 'Each', 
'Fee for restoration repairs unable to be performed in field (not contractor fault).',
'Not for "spotters" visiting site prior to mobilization.',
'Paid per each with Supervisor pre-approval.',
750.00);

-- 67. MISC ITEM
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('M11', 'MISCELLANEOUS PAYMENT', 'Quote', 
'For restoration services not listed in contract (special circumstances, T&M).',
'Not for unit prices not captured during award.',
'Paid per approved quote with Supervisor pre-approval.',
1.00);

-- 68. MOBILIZATION FEE - SOFT
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('69012168', 'MOBILIZATION FEE - SOFT', 'EA', 
'Fixed fee for minimum quantities to mobilize crews, supplies, and equipment for soft restoration.',
'Not for unit prices not captured during award.',
'One-time charge per project location for soft restoration.');

-- 69. MOBILIZATION FEE - HARD
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('69012167', 'MOBILIZATION FEE - HARD', 'EA', 
'Fixed fee for minimum quantities to mobilize crews, supplies, and equipment for hard restoration.',
'Not for unit prices not captured during award.',
'One-time charge per project location for hard restoration.',
500.00);

-- 70. MOBILIZATION FEE – PAVING
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit) 
VALUES ('69012169', 'MOBILIZATION FEE – PAVING', 'EA', 
'Fixed fee for minimum quantities to mobilize crews, supplies, and equipment for paving.',
'Not for unit prices not captured during award.',
'One-time charge per project location for paving.',
800.00);

-- 71. MOBILIZATION FEE – Base to Grade
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('XXXXXXX1', 'MOBILIZATION FEE – Base to Grade', 'EA', 
'Fixed fee for minimum quantities to mobilize crews, supplies, and equipment for base to grade work.',
'Not for unit prices not captured during award.',
'One-time charge per project location for base to grade work.');

-- 72. MOBILIZATION FEE – General Hard - Fixed quote
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('XXXXXXX2', 'MOBILIZATION FEE – General Hard', 'EA', 
'Fixed fee for minimum quantities to mobilize crews, supplies, and equipment for general hard restoration.',
'Not for unit prices not captured during award.',
'One-time charge for multiple openings greater than 150'' apart for hard restoration.');

-- 73. MOBILIZATION FEE – General Soft - Fixed quote
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause) 
VALUES ('XXXXXXX3', 'MOBILIZATION FEE – General Soft', 'EA', 
'Fixed fee for minimum quantities to mobilize crews, supplies, and equipment for general soft restoration.',
'Not for unit prices not captured during award.',
'One-time charge for multiple openings greater than 150'' apart for soft restoration.');

INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause)
VALUES ('800230', 'Not available', 'Not available', 'Not available', 'Not available', 'Not available');
-- es un item de asfalto y concreto
-- MOBILIZATION FEE - BASE TO GRADE
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, PaymentClause, CostPerUnit)
VALUES ('69012207', 'MOBILIZATION FEE - BASE TO GRADE', 'EA', 
'Fixed fee for minimum quantities to mobilize crews, supplies, and equipment for base to grade work.',
'Not for unit prices not captured during award.',
'One-time charge per project location for base to grade work.',
500.00);



