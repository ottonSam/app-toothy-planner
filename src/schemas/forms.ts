import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres.')
  .regex(/[A-Z]/, 'A senha deve ter uma letra maiuscula.')
  .regex(/[a-z]/, 'A senha deve ter uma letra minuscula.')
  .regex(/[0-9]/, 'A senha deve ter um numero.')
  .regex(/[^A-Za-z0-9]/, 'A senha deve ter um caractere especial.');

export const loginFormSchema = z.object({
  email: z.string().min(1, 'Informe o email.').email('Informe um email valido.'),
  password: z.string().min(1, 'Informe a senha.'),
});

export const registerFormSchema = z.object({
  name: z.string().min(2, 'Informe um nome com pelo menos 2 caracteres.'),
  email: z.string().min(1, 'Informe o email.').email('Informe um email valido.'),
  password: passwordSchema,
});

export const activationCodeFormSchema = z.object({
  email: z.string().min(1, 'Informe o email.').email('Informe um email valido.'),
});

export const activateUserFormSchema = z.object({
  email: z.string().min(1, 'Informe o email.').email('Informe um email valido.'),
  code: z
    .string()
    .min(6, 'Informe o codigo com 6 digitos.')
    .max(6, 'Informe o codigo com 6 digitos.'),
});

export const goalFormSchema = z.object({
  name: z.string().min(3, 'Informe um titulo com pelo menos 3 caracteres.'),
  type: z.enum(['LONG_TERM', 'MEDIUM_TERM', 'CALENDAR'], {
    error: 'Selecione um tipo de objetivo.',
  }),
});

export const calendarFormSchema = z.object({
  description: z.string().min(3, 'Informe um titulo com pelo menos 3 caracteres.'),
  starts: z
    .string()
    .min(1, 'Informe a data inicial.')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD.'),
  weeks: z
    .string()
    .min(1, 'Informe a quantidade de semanas.')
    .refine((value) => Number.isInteger(Number(value)), 'Informe um numero inteiro.')
    .refine((value) => Number(value) >= 1, 'O calendario deve ter pelo menos 1 semana.')
    .refine((value) => Number(value) <= 52, 'O calendario deve ter no maximo 52 semanas.'),
});

export const activityFormSchema = z
  .object({
    description: z.string().min(3, 'Informe uma descricao com pelo menos 3 caracteres.'),
    goal: z.string().min(1, 'Informe a meta da atividade.'),
    type: z.enum(['DAYS', 'COUNT', 'TIME'], {
      error: 'Selecione o tipo da atividade.',
    }),
  })
  .superRefine((data, context) => {
    if ((data.type === 'DAYS' || data.type === 'COUNT') && !/^\d+$/.test(data.goal)) {
      context.addIssue({
        code: 'custom',
        message: 'Para Dias ou Contagem, informe um numero inteiro positivo.',
        path: ['goal'],
      });
    }

    if ((data.type === 'DAYS' || data.type === 'COUNT') && Number(data.goal) <= 0) {
      context.addIssue({
        code: 'custom',
        message: 'A meta deve ser maior que zero.',
        path: ['goal'],
      });
    }

    if (data.type === 'TIME' && !/^(\d+h)?\s*(\d+m)?$/.test(data.goal.trim())) {
      context.addIssue({
        code: 'custom',
        message: 'Use horas e minutos, por exemplo 3h 20m, 45m ou 2h.',
        path: ['goal'],
      });
    }
  });

export const countProgressFormSchema = z.object({
  value: z
    .string()
    .min(1, 'Informe o progresso.')
    .refine((value) => Number.isInteger(Number(value)), 'Informe um numero inteiro.')
    .refine((value) => Number(value) > 0, 'O valor deve ser positivo.'),
});

export const timeProgressFormSchema = z.object({
  time: z
    .string()
    .min(1, 'Informe o tempo.')
    .regex(/^(\d+h)?\s*(\d+m)?$/, 'Use horas e minutos, por exemplo 1h 30m, 45m ou 2h.'),
});

export const weeklyReportFormSchema = z.object({
  userFeedback: z.string().trim().min(1, 'Informe um comentario sobre a semana.'),
});

export const profileFormSchema = z.object({
  name: z.string().min(2, 'Informe um nome com pelo menos 2 caracteres.'),
  theme: z.enum(['DARK', 'LIGHT'], {
    error: 'Selecione um tema.',
  }),
});

export const passwordUpdateFormSchema = z
  .object({
    password: passwordSchema,
    passwordConfirmation: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'As senhas devem ser iguais.',
    path: ['passwordConfirmation'],
  });

export const profileImageFormSchema = z.object({
  image: z
    .string()
    .min(1, 'Selecione uma imagem.')
    .regex(/^data:image\/(png|jpeg|jpg|webp);base64,/, 'Selecione uma imagem valida.'),
});

export const focusSessionFormSchema = z.object({
  focusMinutes: z
    .string()
    .trim()
    .min(1, 'Informe o tempo de foco.')
    .refine((value) => Number.isInteger(Number(value)), 'Informe minutos inteiros.')
    .refine(
      (value) => Number(value) >= 1 && Number(value) <= 180,
      'O foco deve ter entre 1 e 180 minutos.'
    ),
  breakMinutes: z
    .string()
    .trim()
    .min(1, 'Informe o tempo de descanso.')
    .refine((value) => Number.isInteger(Number(value)), 'Informe minutos inteiros.')
    .refine(
      (value) => Number(value) >= 1 && Number(value) <= 60,
      'O descanso deve ter entre 1 e 60 minutos.'
    ),
});

const positiveDecimalString = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Informe ${label}.`)
    .refine(
      (value) => Number.isFinite(Number(value.replace(',', '.'))),
      'Informe um numero valido.'
    )
    .refine((value) => Number(value.replace(',', '.')) > 0, `${label} deve ser maior que zero.`);

export const expenseWalletFormSchema = z.object({
  description: z.string().trim().min(2, 'Informe uma descricao com pelo menos 2 caracteres.'),
  spendingGoal: positiveDecimalString('a meta de gastos'),
  startsAt: z
    .string()
    .min(1, 'Informe a data inicial.')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD.'),
  targetSpendingDay: z
    .string()
    .min(1, 'Informe o dia alvo.')
    .refine((value) => Number.isInteger(Number(value)), 'Informe um dia inteiro.')
    .refine((value) => Number(value) >= 1 && Number(value) <= 31, 'O dia deve estar entre 1 e 31.'),
});

export const expenseFormSchema = z
  .object({
    type: z.enum(['ONE_TIME', 'INSTALLMENT', 'RECURRING'], {
      error: 'Selecione o tipo do gasto.',
    }),
    categoryId: z.string().min(1, 'Selecione uma categoria.'),
    description: z.string().trim().min(2, 'Informe uma descricao com pelo menos 2 caracteres.'),
    amount: positiveDecimalString('o valor'),
    amountMode: z.enum(['TOTAL', 'INSTALLMENT']),
    installments: z.string(),
    date: z
      .string()
      .min(1, 'Informe a data.')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD.'),
  })
  .superRefine((data, context) => {
    if (data.type !== 'INSTALLMENT') {
      return;
    }

    if (!Number.isInteger(Number(data.installments)) || Number(data.installments) <= 0) {
      context.addIssue({
        code: 'custom',
        message: 'Informe uma quantidade de parcelas maior que zero.',
        path: ['installments'],
      });
    }
  });

export const textExpenseFormSchema = z.object({
  referenceDate: z
    .string()
    .min(1, 'Informe a data de referencia.')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD.'),
  text: z.string().trim().min(8, 'Descreva o gasto com pelo menos 8 caracteres.'),
});

export const audioExpenseFormSchema = z.object({
  referenceDate: z
    .string()
    .min(1, 'Informe a data de referencia.')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD.'),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;
export type RegisterFormData = z.infer<typeof registerFormSchema>;
export type ActivationCodeFormData = z.infer<typeof activationCodeFormSchema>;
export type ActivateUserFormData = z.infer<typeof activateUserFormSchema>;
export type GoalFormData = z.infer<typeof goalFormSchema>;
export type CalendarFormData = z.infer<typeof calendarFormSchema>;
export type ActivityFormData = z.infer<typeof activityFormSchema>;
export type CountProgressFormData = z.infer<typeof countProgressFormSchema>;
export type TimeProgressFormData = z.infer<typeof timeProgressFormSchema>;
export type WeeklyReportFormData = z.infer<typeof weeklyReportFormSchema>;
export type ProfileFormData = z.infer<typeof profileFormSchema>;
export type PasswordUpdateFormData = z.infer<typeof passwordUpdateFormSchema>;
export type ProfileImageFormData = z.infer<typeof profileImageFormSchema>;
export type FocusSessionFormData = z.infer<typeof focusSessionFormSchema>;
export type ExpenseWalletFormData = z.infer<typeof expenseWalletFormSchema>;
export type ExpenseFormData = z.infer<typeof expenseFormSchema>;
export type AudioExpenseFormData = z.infer<typeof audioExpenseFormSchema>;
export type TextExpenseFormData = z.infer<typeof textExpenseFormSchema>;
