-- Seed Categories Migration
-- Issue #41: Los nombres de las categorías deben de iniciar en mayúscula

-- Insertar géneros si no existen
INSERT INTO "genders" (id, name, created_at, updated_at) 
VALUES 
    ('gender_hombre', 'Hombre', NOW(), NOW()),
    ('gender_mujer', 'Mujer', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insertar categorías con nombres capitalizados
INSERT INTO "categories" (id, name, description, status, created_at, updated_at) VALUES
    ('cat_camisas', 'Camisas', NULL, true, NOW(), NOW()),
    ('cat_blusas', 'Blusas', NULL, true, NOW(), NOW()),
    ('cat_camisetas', 'Camisetas', NULL, true, NOW(), NOW()),
    ('cat_pantalones', 'Pantalones', NULL, true, NOW(), NOW()),
    ('cat_jeans', 'Jeans', NULL, true, NOW(), NOW()),
    ('cat_shorts', 'Shorts', NULL, true, NOW(), NOW()),
    ('cat_falda', 'Falda', NULL, true, NOW(), NOW()),
    ('cat_vestidos', 'Vestidos', NULL, true, NOW(), NOW()),
    ('cat_chaquetas', 'Chaquetas', NULL, true, NOW(), NOW()),
    ('cat_hoodies', 'Hoodies', NULL, true, NOW(), NOW()),
    ('cat_abrigos', 'Abrigos', NULL, true, NOW(), NOW()),
    ('cat_trajes', 'Trajes', NULL, true, NOW(), NOW()),
    ('cat_trajes_bano', 'Trajes de baño', NULL, true, NOW(), NOW()),
    ('cat_ropa_interior', 'Ropa interior', NULL, true, NOW(), NOW()),
    ('cat_sudaderas', 'Sudaderas', NULL, true, NOW(), NOW()),
    ('cat_leggins', 'Leggins', NULL, true, NOW(), NOW()),
    ('cat_pijamas', 'Pijamas', NULL, true, NOW(), NOW()),
    ('cat_calcetines', 'Calcetines', NULL, true, NOW(), NOW()),
    ('cat_zapatos', 'Zapatos', NULL, true, NOW(), NOW()),
    ('cat_botas', 'Botas', NULL, true, NOW(), NOW()),
    ('cat_sandalias', 'Sandalias', NULL, true, NOW(), NOW()),
    ('cat_chalecos', 'Chalecos', NULL, true, NOW(), NOW()),
    ('cat_gorros', 'Gorros', NULL, true, NOW(), NOW()),
    ('cat_bufandas', 'Bufandas', NULL, true, NOW(), NOW()),
    ('cat_guantes', 'Guantes', NULL, true, NOW(), NOW()),
    ('cat_accesorios', 'Accesorios', NULL, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insertar relaciones categoría-género
-- Categorías para ambos géneros (Hombre y Mujer)
INSERT INTO "category_genders" (id, category_id, "genderId") VALUES
    -- Camisas: Hombre y Mujer
    ('cg_camisas_h', 'cat_camisas', 'gender_hombre'),
    ('cg_camisas_m', 'cat_camisas', 'gender_mujer'),
    -- Camisetas: Hombre y Mujer
    ('cg_camisetas_h', 'cat_camisetas', 'gender_hombre'),
    ('cg_camisetas_m', 'cat_camisetas', 'gender_mujer'),
    -- Pantalones: Hombre y Mujer
    ('cg_pantalones_h', 'cat_pantalones', 'gender_hombre'),
    ('cg_pantalones_m', 'cat_pantalones', 'gender_mujer'),
    -- Jeans: Hombre y Mujer
    ('cg_jeans_h', 'cat_jeans', 'gender_hombre'),
    ('cg_jeans_m', 'cat_jeans', 'gender_mujer'),
    -- Shorts: Hombre y Mujer
    ('cg_shorts_h', 'cat_shorts', 'gender_hombre'),
    ('cg_shorts_m', 'cat_shorts', 'gender_mujer'),
    -- Chaquetas: Hombre y Mujer
    ('cg_chaquetas_h', 'cat_chaquetas', 'gender_hombre'),
    ('cg_chaquetas_m', 'cat_chaquetas', 'gender_mujer'),
    -- Hoodies: Hombre y Mujer
    ('cg_hoodies_h', 'cat_hoodies', 'gender_hombre'),
    ('cg_hoodies_m', 'cat_hoodies', 'gender_mujer'),
    -- Abrigos: Hombre y Mujer
    ('cg_abrigos_h', 'cat_abrigos', 'gender_hombre'),
    ('cg_abrigos_m', 'cat_abrigos', 'gender_mujer'),
    -- Trajes de baño: Hombre y Mujer
    ('cg_trajes_bano_h', 'cat_trajes_bano', 'gender_hombre'),
    ('cg_trajes_bano_m', 'cat_trajes_bano', 'gender_mujer'),
    -- Ropa interior: Hombre y Mujer
    ('cg_ropa_interior_h', 'cat_ropa_interior', 'gender_hombre'),
    ('cg_ropa_interior_m', 'cat_ropa_interior', 'gender_mujer'),
    -- Sudaderas: Hombre y Mujer
    ('cg_sudaderas_h', 'cat_sudaderas', 'gender_hombre'),
    ('cg_sudaderas_m', 'cat_sudaderas', 'gender_mujer'),
    -- Pijamas: Hombre y Mujer
    ('cg_pijamas_h', 'cat_pijamas', 'gender_hombre'),
    ('cg_pijamas_m', 'cat_pijamas', 'gender_mujer'),
    -- Calcetines: Hombre y Mujer
    ('cg_calcetines_h', 'cat_calcetines', 'gender_hombre'),
    ('cg_calcetines_m', 'cat_calcetines', 'gender_mujer'),
    -- Zapatos: Hombre y Mujer
    ('cg_zapatos_h', 'cat_zapatos', 'gender_hombre'),
    ('cg_zapatos_m', 'cat_zapatos', 'gender_mujer'),
    -- Botas: Hombre y Mujer
    ('cg_botas_h', 'cat_botas', 'gender_hombre'),
    ('cg_botas_m', 'cat_botas', 'gender_mujer'),
    -- Sandalias: Hombre y Mujer
    ('cg_sandalias_h', 'cat_sandalias', 'gender_hombre'),
    ('cg_sandalias_m', 'cat_sandalias', 'gender_mujer'),
    -- Chalecos: Hombre y Mujer
    ('cg_chalecos_h', 'cat_chalecos', 'gender_hombre'),
    ('cg_chalecos_m', 'cat_chalecos', 'gender_mujer'),
    -- Gorros: Hombre y Mujer
    ('cg_gorros_h', 'cat_gorros', 'gender_hombre'),
    ('cg_gorros_m', 'cat_gorros', 'gender_mujer'),
    -- Bufandas: Hombre y Mujer
    ('cg_bufandas_h', 'cat_bufandas', 'gender_hombre'),
    ('cg_bufandas_m', 'cat_bufandas', 'gender_mujer'),
    -- Guantes: Hombre y Mujer
    ('cg_guantes_h', 'cat_guantes', 'gender_hombre'),
    ('cg_guantes_m', 'cat_guantes', 'gender_mujer'),
    -- Accesorios: Hombre y Mujer
    ('cg_accesorios_h', 'cat_accesorios', 'gender_hombre'),
    ('cg_accesorios_m', 'cat_accesorios', 'gender_mujer'),
    
    -- Categorías solo para Mujer
    -- Blusas: solo Mujer
    ('cg_blusas_m', 'cat_blusas', 'gender_mujer'),
    -- Falda: solo Mujer
    ('cg_falda_m', 'cat_falda', 'gender_mujer'),
    -- Vestidos: solo Mujer
    ('cg_vestidos_m', 'cat_vestidos', 'gender_mujer'),
    -- Leggins: solo Mujer
    ('cg_leggins_m', 'cat_leggins', 'gender_mujer'),
    
    -- Categorías solo para Hombre
    -- Trajes: solo Hombre
    ('cg_trajes_h', 'cat_trajes', 'gender_hombre')
ON CONFLICT DO NOTHING;