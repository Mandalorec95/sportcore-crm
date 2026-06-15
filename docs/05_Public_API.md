# Public API

Public API нужен для внешних интеграций: сайтов клуба, личных кабинетов, мобильных приложений, виджетов расписания и финансовых интеграций. Все публичные endpoints находятся под префиксом:

```text
/api/v1/public/v1
```

Полная интерактивная документация доступна в Swagger:

```text
https://YOUR_DOMAIN/docs
```

## Авторизация

Публичный API использует API-ключ в HTTP-заголовке:

```http
X-API-Key: sp_live_...
```

Ключ создаётся администратором в разделе API-ключей. Сырой ключ показывается только один раз при создании, поэтому его нужно сразу сохранить на стороне интеграции.

Пример:

```bash
curl -H "X-API-Key: sp_live_xxxxxxxxxxxxxxxxxxxxxxxx" \
  https://crm.example.com/api/v1/public/v1/athletes/ath-001
```

## Endpoints

| Метод | URL | Назначение |
| --- | --- | --- |
| GET | `/athletes/:id` | Цифровой паспорт спортсмена |
| GET | `/athletes/:id/attendance` | Посещаемость спортсмена |
| GET | `/athletes/:id/progress` | Прогресс спортсмена |
| GET | `/athletes/:id/competitions` | Соревнования и результаты спортсмена |
| GET | `/athletes/:id/payments` | Баланс и платежи спортсмена |
| GET | `/groups/:id/schedule` | Расписание группы |
| GET | `/competitions` | Список соревнований организации |

Все запросы ограничены организацией, к которой привязан API-ключ. Получить данные другой организации через публичный API нельзя.

## Примеры

Цифровой паспорт спортсмена:

```bash
curl -H "X-API-Key: sp_live_xxxxxxxxxxxxxxxxxxxxxxxx" \
  https://crm.example.com/api/v1/public/v1/athletes/ath-001
```

Баланс спортсмена:

```bash
curl -H "X-API-Key: sp_live_xxxxxxxxxxxxxxxxxxxxxxxx" \
  https://crm.example.com/api/v1/public/v1/athletes/ath-001/payments
```

Расписание группы:

```bash
curl -H "X-API-Key: sp_live_xxxxxxxxxxxxxxxxxxxxxxxx" \
  https://crm.example.com/api/v1/public/v1/groups/group-001/schedule
```

Список соревнований:

```bash
curl -H "X-API-Key: sp_live_xxxxxxxxxxxxxxxxxxxxxxxx" \
  https://crm.example.com/api/v1/public/v1/competitions
```

## Создание API-ключа

Внутренний endpoint для создания ключа требует JWT администратора:

```bash
curl -X POST https://crm.example.com/api/v1/api-keys \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Website integration",
    "scopes": ["athletes:read", "payments:read"]
  }'
```

Ответ содержит `key` только при создании:

```json
{
  "id": "uuid",
  "name": "Website integration",
  "key": "sp_live_xxxxxxxxxxxxxxxxxxxxxxxx",
  "scopes": ["athletes:read", "payments:read"]
}
```

## Формат ошибок

Типовые ответы:

| Код | Причина |
| --- | --- |
| 401 | Нет `X-API-Key`, ключ неверный или отозван |
| 404 | Запрошенная сущность не найдена |
| 500 | Ошибка сервера |

Пример ошибки:

```json
{
  "message": "Недействительный API-ключ",
  "error": "Unauthorized",
  "statusCode": 401
}
```

## Рекомендации для интеграций

- хранить API-ключ только на backend-стороне интеграции;
- не вставлять `sp_live_...` в frontend-код, мобильное приложение или публичный JavaScript;
- использовать HTTPS;
- заводить отдельный ключ на каждую интеграцию;
- отзывать ключ при компрометации или смене подрядчика;
- сверять фактический контракт через `/docs`, потому что Swagger генерируется из backend-кода.
