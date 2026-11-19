# Food Diary PWA

PWA-приложение для ежедневного учёта белков, жиров, углеводов и калорий.

## Что реализовано

- Авторизация и регистрация через Firebase Authentication (email/password).
- Сохранение сессии пользователя (повторный вход не требуется).
- Форма ввода Б/Ж/У/калорий.
- Автопересчёт калорий при изменении Б/Ж/У по формуле:
  - `калории = 4 * белки + 4 * углеводы + 9 * жиры`
- При ручном вводе калорий используется введённое значение.
- Список записей за сегодня с временем и удалением каждой записи.
- Суммарные панели: сегодня, текущая неделя (пн-вс), текущий месяц.
- Полное разделение данных пользователей по `userId`.
- PWA: `manifest.json`, `service worker`, offline caching, иконки 192x192 и 512x512.

## 1. Правила безопасности Firestore

Файл в проекте: `firestore.rules`

Текст для вставки в Firebase Console:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /entries/{entryId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null
        && resource.data.userId == request.auth.uid
        && request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 2. Инструкция по деплою (пошагово)

1. Установите зависимости:
   - `npm install`
2. В файле `src/firebase.ts` вставьте ваш `firebaseConfig` из Firebase Console.
3. Укажите ваш Firebase Project ID в `.firebaserc` (`default`).
4. Включите в Firebase Console:
   - Authentication -> Sign-in method -> Email/Password
   - Firestore Database (Production mode)
   - Hosting
5. Задеплойте правила Firestore:
   - `npx firebase deploy --only firestore:rules`
6. Соберите frontend:
   - `npm run build`
7. Задеплойте Hosting:
   - `npx firebase deploy --only hosting`

После этого приложение будет доступно по URL Firebase Hosting.

## 3. Инструкция по установке на iPhone

1. Откройте приложение в Safari по URL Firebase Hosting.
2. Нажмите кнопку «Поделиться».
3. Выберите «На экран "Домой"».
4. Подтвердите добавление.
5. Запускайте приложение с иконки на домашнем экране (режим standalone).

## 4. Возможные проблемы и решения

- Проблема: Ошибка `Missing or insufficient permissions`.
  - Решение: проверьте, что в Firestore опубликованы правила из `firestore.rules`.

- Проблема: После обновления кода в PWA старая версия на телефоне.
  - Решение: закройте приложение, откройте снова с интернетом, при необходимости очистите данные сайта в Safari.

- Проблема: Не работает вход.
  - Решение: проверьте, что в Firebase Authentication включён Email/Password.

- Проблема: Пустой экран после деплоя.
  - Решение: убедитесь, что `firebase.json` использует `public: "dist"` и выполнен `npm run build`.

- Проблема: Ошибка инициализации Firebase.
  - Решение: проверьте корректность всех полей `firebaseConfig` и `projectId` в `.firebaserc`.

- Проблема: Offline не работает с первого запуска.
  - Решение: service worker кэширует ресурсы после первого успешного открытия онлайн.

## Структура ключевых файлов

- `src/App.vue` - UI, логика формы, расчёты, агрегаты, удаление записей.
- `src/firebase.ts` - инициализация Firebase.
- `public/manifest.json` - настройки PWA.
- `public/sw.js` - сервис-воркер и offline кэш.
- `firestore.rules` - правила безопасности Firestore.
- `firebase.json` - конфигурация Firebase Hosting + Firestore rules.
