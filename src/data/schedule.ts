export type ClassInfo = {
  time: string;
  subject: string;
  teacher: string;
  auditorium: string;
};

export type DaySchedule = {
  day: string;
  classes: ClassInfo[];
};

export type GroupSchedule = {
  group: string;
  schedule: DaySchedule[];
};

export const scheduleData: GroupSchedule = {
  "group": "IT-126/40",
  "schedule": [
      {
          "day": "Дүйсенбі",
          "classes": [
              {
                  "time": "09.00 - 09.50",
                  "subject": "Орыс тілі /пр/",
                  "teacher": "Маг.аға оқытушы Болганбаева Ш.",
                  "auditorium": "304"
              },
              {
                  "time": "10.00 - 10.50",
                  "subject": "Академ.жазу негіздері/лек/",
                  "teacher": "Ма.аға оқытушы Байларова Т.",
                  "auditorium": "308"
              },
              {
                  "time": "11.00 - 11.50",
                  "subject": "Дене шынықтыру(пр)",
                  "teacher": "Аға.оқ.. Тулеев Е.И.",
                  "auditorium": "С/т зал"
              },
              {
                  "time": "12.00 - 12.50",
                  "subject": "Дене шынықтыру(пр)",
                  "teacher": "Аға.оқ.. Тулеев Е.И.",
                  "auditorium": "С/т зал"
              }
          ]
      },
      {
          "day": "Сейсенбі",
          "classes": [
              {
                  "time": "09.00 - 09.50",
                  "subject": "Құқық негіздері/лек/",
                  "teacher": "Маг.аға оқытушы Ескендирова Г.",
                  "auditorium": "507"
              },
              {
                  "time": "10.00 - 10.50",
                  "subject": "Құқық негіздері/лек/",
                  "teacher": "Маг.аға оқытушы Ескендирова Г.",
                  "auditorium": "507"
              },
              {
                  "time": "11.00 - 11.50",
                  "subject": "Мәдениеттану, психология/лек/",
                  "teacher": "Аға оқытушы Ахметов С.",
                  "auditorium": "507"
              },
              {
                  "time": "12.00 - 12.50",
                  "subject": "Мәдениеттану, психология/пр/",
                  "teacher": "Аға оқытушы Ахметов С.",
                  "auditorium": "216"
              }
          ]
      },
      {
          "day": "Сәрсенбі",
          "classes": [
              {
                  "time": "10.00 - 10.50",
                  "subject": "Мәдениеттану, психология/пр/",
                  "teacher": "Аға оқытушы Ахметов С.",
                  "auditorium": "202"
              },
              {
                  "time": "11.00 - 11.50",
                  "subject": "Құқық негіздері/пр/",
                  "teacher": "Маг.аға оқытушы Ескендирова Г.",
                  "auditorium": "202"
              }
          ]
      },
      {
          "day": "Бейсенбі",
          "classes": [
              {
                  "time": "10.00 - 10.50",
                  "subject": "Академ.жазу негіздері/лек/",
                  "teacher": "Ма.аға оқытушы Байларова Т.",
                  "auditorium": "307"
              },
              {
                  "time": "11.00 - 11.50",
                  "subject": "Орыс тілі /пр/",
                  "teacher": "Маг.аға оқытушы Болганбаева Ш.",
                  "auditorium": "202"
              },
              {
                  "time": "12.00 - 12.50",
                  "subject": "Орыс тілі /пр/",
                  "teacher": "Маг.аға оқытушы Болганбаева Ш.",
                  "auditorium": "202"
              },
              {
                  "time": "13.00 - 13.50",
                  "subject": "Шетел тілі /пр/",
                  "teacher": "Аға оқытушы Курманбаева П.",
                  "auditorium": "202"
              }
          ]
      },
      {
          "day": "Жұма",
          "classes": [
              {
                  "time": "10.00 - 10.50",
                  "subject": "Шетел тілі /пр/",
                  "teacher": "Аға оқытушы Курманбаева П.",
                  "auditorium": "104"
              },
              {
                  "time": "11.00 - 11.50",
                  "subject": "Шетел тілі /пр/",
                  "teacher": "Аға оқытушы Курманбаева П.",
                  "auditorium": "208"
              },
              {
                  "time": "12.00 - 12.50",
                  "subject": "Академ.жазу негіздері/пр/",
                  "teacher": "Ма.аға оқытушы Байларова Т.",
                  "auditorium": "208"
              }
          ]
      }
  ]
};
