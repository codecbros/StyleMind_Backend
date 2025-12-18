-- Seed Categories Migration
-- Issue #41: Los nombres de las categorías deben de iniciar en mayúscula

-- Insertar géneros si no existen
INSERT INTO "genders" (id, name, created_at, updated_at)
VALUES
    ('gender_hombre', 'Hombre', NOW(), NOW()),
    ('gender_mujer', 'Mujer', NOW(), NOW()),
    ('gender_prefiero_no_decirlo', 'Prefiero no decirlo', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Bloque anónimo para procesar categorías
DO $$
DECLARE
    v_category RECORD;
    v_existing_id TEXT;
    v_gender_id TEXT;
    v_gender RECORD;
    v_hombre_id TEXT;
    v_mujer_id TEXT;
    
    -- Definición de categorías con sus géneros
    v_categories JSON := '[
        { "name": "Camisas", "original": "camisas", "genders": ["Hombre", "Mujer"] },
        { "name": "Blusas", "original": "blusas", "genders": ["Mujer"] },
        { "name": "Camisetas", "original": "camisetas", "genders": ["Hombre", "Mujer"] },
        { "name": "Pantalones", "original": "pantalones", "genders": ["Hombre", "Mujer"] },
        { "name": "Jeans", "original": "jeans", "genders": ["Hombre", "Mujer"] },
        { "name": "Shorts", "original": "shorts", "genders": ["Hombre", "Mujer"] },
        { "name": "Falda", "original": "falda", "genders": ["Mujer"] },
        { "name": "Vestidos", "original": "vestidos", "genders": ["Mujer"] },
        { "name": "Chaquetas", "original": "chaquetas", "genders": ["Hombre", "Mujer"] },
        { "name": "Hoodies", "original": "hoodies", "genders": ["Hombre", "Mujer"] },
        { "name": "Abrigos", "original": "abrigos", "genders": ["Hombre", "Mujer"] },
        { "name": "Trajes", "original": "trajes", "genders": ["Hombre"] },
        { "name": "Trajes de baño", "original": "trajes de baño", "genders": ["Hombre", "Mujer"] },
        { "name": "Ropa interior", "original": "ropa interior", "genders": ["Hombre", "Mujer"] },
        { "name": "Sudaderas", "original": "sudaderas", "genders": ["Hombre", "Mujer"] },
        { "name": "Leggins", "original": "leggins", "genders": ["Mujer"] },
        { "name": "Pijamas", "original": "pijamas", "genders": ["Hombre", "Mujer"] },
        { "name": "Calcetines", "original": "calcetines", "genders": ["Hombre", "Mujer"] },
        { "name": "Zapatos", "original": "zapatos", "genders": ["Hombre", "Mujer"] },
        { "name": "Botas", "original": "botas", "genders": ["Hombre", "Mujer"] },
        { "name": "Sandalias", "original": "sandalias", "genders": ["Hombre", "Mujer"] },
        { "name": "Chalecos", "original": "chalecos", "genders": ["Hombre", "Mujer"] },
        { "name": "Gorros", "original": "gorros", "genders": ["Hombre", "Mujer"] },
        { "name": "Bufandas", "original": "bufandas", "genders": ["Hombre", "Mujer"] },
        { "name": "Guantes", "original": "guantes", "genders": ["Hombre", "Mujer"] },
        { "name": "Accesorios", "original": "accesorios", "genders": ["Hombre", "Mujer"] }
    ]';
BEGIN
    -- Obtener IDs de géneros
    SELECT id INTO v_hombre_id FROM "genders" WHERE name = 'Hombre';
    SELECT id INTO v_mujer_id FROM "genders" WHERE name = 'Mujer';
    
    -- Recorrer cada categoría definida
    FOR v_category IN SELECT * FROM json_array_elements(v_categories)
    LOOP
        -- Buscar si existe la categoría (case insensitive)
        SELECT id INTO v_existing_id 
        FROM "categories" 
        WHERE LOWER(name) = LOWER(v_category.value->>'original')
           OR LOWER(name) = LOWER(v_category.value->>'name');
        
        IF v_existing_id IS NOT NULL THEN
            -- La categoría existe, solo actualizar el nombre para capitalizarlo
            UPDATE "categories" 
            SET name = v_category.value->>'name',
                updated_at = NOW()
            WHERE id = v_existing_id;
            
            RAISE NOTICE 'Categoría actualizada: %', v_category.value->>'name';
        ELSE
            -- La categoría no existe, insertarla
            v_existing_id := 'cat_' || REPLACE(LOWER(v_category.value->>'original'), ' ', '_');
            
            INSERT INTO "categories" (id, name, description, status, created_at, updated_at)
            VALUES (
                v_existing_id,
                v_category.value->>'name',
                NULL,
                true,
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'Categoría insertada: %', v_category.value->>'name';
            
            -- Insertar relaciones de género para la nueva categoría
            FOR v_gender IN SELECT * FROM json_array_elements_text(v_category.value->'genders')
            LOOP
                IF v_gender.value = 'Hombre' AND v_hombre_id IS NOT NULL THEN
                    INSERT INTO "category_genders" (id, category_id, "genderId")
                    VALUES (
                        'cg_' || REPLACE(LOWER(v_category.value->>'original'), ' ', '_') || '_h',
                        v_existing_id,
                        v_hombre_id
                    )
                    ON CONFLICT DO NOTHING;
                ELSIF v_gender.value = 'Mujer' AND v_mujer_id IS NOT NULL THEN
                    INSERT INTO "category_genders" (id, category_id, "genderId")
                    VALUES (
                        'cg_' || REPLACE(LOWER(v_category.value->>'original'), ' ', '_') || '_m',
                        v_existing_id,
                        v_mujer_id
                    )
                    ON CONFLICT DO NOTHING;
                END IF;
            END LOOP;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migración de categorías completada exitosamente.';
END $$;