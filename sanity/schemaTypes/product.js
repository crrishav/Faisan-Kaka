import { defineType, defineField } from 'sanity';

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Product Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(3).max(100),
      description: 'Name of the product (e.g., "Classic Streetwear Hoodie")',
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
      description: 'URL-friendly identifier auto-generated from title',
    }),

    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'T-Shirts', value: 'T-Shirts' },
          { title: 'Hoodies', value: 'Hoodies' },
          { title: 'Pants', value: 'Pants' },
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
      description: 'Product category for organization',
    }),

    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.max(500),
      description: 'Brief product description visible to customers',
    }),

    defineField({
      name: 'mainImage',
      title: 'Main Product Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
      description: 'Primary product image (recommended: front view)',
    }),

    defineField({
      name: 'images',
      title: 'Additional Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
        },
      ],
      description: 'Gallery images (back view, details, lifestyle shots)',
    }),

    defineField({
      name: 'priceINR',
      title: 'Price (INR)',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
      description: 'Price in Indian Rupees',
    }),

    defineField({
      name: 'priceNPR',
      title: 'Price (NPR)',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
      description: 'Price in Nepalese Rupees',
    }),

    defineField({
      name: 'sizes',
      title: 'Available Sizes',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      },
      description: 'Select available sizes for this product',
    }),

    defineField({
      name: 'colors',
      title: 'Available Colors',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'E.g., Black, White, Navy, etc.',
    }),

    defineField({
      name: 'inStock',
      title: 'In Stock',
      type: 'boolean',
      initialValue: true,
      description: 'Toggle product availability',
    }),

    defineField({
      name: 'featured',
      title: 'Featured Product',
      type: 'boolean',
      initialValue: false,
      description: 'Show on homepage or special sections',
    }),

    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],

  preview: {
    select: {
      title: 'title',
      category: 'category',
      media: 'mainImage',
    },
    prepare(selection) {
      const { title, category} = selection;
      return {
        title: title,
        subtitle: category,
        media: selection.media,
      };
    },
  },
});
