import { defineType, defineField } from 'sanity';

export const designAsset = defineType({
  name: 'designAsset',
  title: 'Design Asset',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(2).max(120),
      description: 'Name for this uploaded file',
    }),
    defineField({
      name: 'file',
      title: 'File',
      type: 'file',
      options: {
        accept: '.png,.svg,.jpg,.jpeg,.pdf',
      },
      validation: (Rule) => Rule.required(),
      description: 'Allowed formats: PNG, SVG, JPG, JPEG, PDF',
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 3,
      description: 'Optional internal notes',
    }),
    defineField({
      name: 'uploadedAt',
      title: 'Uploaded At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'file.asset.originalFilename',
    },
    prepare({ title, subtitle }) {
      return {
        title: title || 'Untitled Asset',
        subtitle: subtitle || 'No file name',
      };
    },
  },
});